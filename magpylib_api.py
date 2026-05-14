from flask import Flask, request, jsonify
from flask_cors import CORS
import magpylib as magpy
import numpy as np
import matplotlib
matplotlib.use('Agg') # Set backend to non-interactive
import matplotlib.pyplot as plt
import io
import base64

app = Flask(__name__)
CORS(app)

def set_axes_equal(ax):
    """
    Make axes of 3D plot have equal scale so that spheres appear as spheres,
    cubes as cubes, etc.
    """
    x_limits = ax.get_xlim3d()
    y_limits = ax.get_ylim3d()
    z_limits = ax.get_zlim3d()

    x_range = abs(x_limits[1] - x_limits[0])
    x_middle = np.mean(x_limits)
    y_range = abs(y_limits[1] - y_limits[0])
    y_middle = np.mean(y_limits)
    z_range = abs(z_limits[1] - z_limits[0])
    z_middle = np.mean(z_limits)

    plot_radius = 0.5 * max([x_range, y_range, z_range])

    ax.set_xlim3d([x_middle - plot_radius, x_middle + plot_radius])
    ax.set_ylim3d([y_middle - plot_radius, y_middle + plot_radius])
    ax.set_zlim3d([z_middle - plot_radius, z_middle + plot_radius])

@app.route('/api/magpylib-forces', methods=['POST'])
def calculate_forces():
    try:
        data = request.json
        
        imanes_base = data.get('imanes_base', [])
        bobinas_data = data.get('bobinas', [])
        
        if not imanes_base or not bobinas_data:
            return jsonify({"error": "Faltan datos de imanes base o bobinas"}), 400
            
        base_magnets = []
        for iman in imanes_base:
            pos = iman.get('posicion')
            if pos is None: pos = [0, 0, 0]
            
            dim = iman.get('dimension')
            if dim is None: dim = [10, 10, 10]
            
            pol = iman.get('magnetizacion')
            if pol is None: pol = [0, 0, 1000]
            
            b_mag = magpy.magnet.Cuboid(
                polarization=pol,
                dimension=np.array(dim) * 1e-3,
                position=np.array([p if p is not None else 0.0 for p in pos]) * 1e-3
            )
            # Colorear el bloque para mostrar los polos
            b_mag.style.magnetization.mode = "color"
            b_mag.style.magnetization.color.north = "red"
            b_mag.style.magnetization.color.south = "blue"
            base_magnets.append(b_mag)
            
        col_base = magpy.Collection(base_magnets)
        
        coils = []
        total_f_x, total_f_y, total_f_z = 0.0, 0.0, 0.0
        calc_only = data.get('calc_only', False)
        
        # Calculate B-field at the center of the rotor (origin) just as a reference value
        B_center = col_base.getB([0,0,0])
        
        force_top_active = np.zeros(3)
        force_bottom_active = np.zeros(3)
        total_torque_x = 0.0

        for b_data in bobinas_data:
            amp_turns = b_data.get('vueltas', 1) * b_data.get('corriente', 1.0)
            if amp_turns == 0: amp_turns = 1e-6
            
            # Dimension: [longitud_x, diametro_rotor] (converted to meters)
            dims_data = b_data.get('dimension')
            if dims_data is None: dims_data = [30, 30]
            dims = np.array(dims_data) * 1e-3
            hl = dims[0] / 2.0
            hw = dims[1] / 2.0
            
            pos_data = b_data.get('posicion')
            if pos_data is None: pos_data = [0, 0, 0]
            pos = np.array(pos_data) * 1e-3
            angle_x = b_data.get('angulo_x', 0)
            
            # Vertices for a rectangular coil in X-Z plane (Z is vertical)
            vertices = [
                [-hl, 0, hw],
                [hl, 0, hw],
                [hl, 0, -hw],
                [-hl, 0, -hw],
                [-hl, 0, hw]
            ]
            
            # Apply color distinction based on current magnitude
            color = 'blue' if abs(amp_turns) > 1e-5 else 'gray'
            coil = magpy.current.Polyline(current=amp_turns, vertices=vertices, position=pos)
            coil.style.arrow.show = False
            
            if abs(amp_turns) > 1e-5:
                coil.style.color = '#ff6600'
                coil.style.line.width = 5
            else:
                coil.style.color = 'gray'
                coil.style.line.width = 2
            if angle_x != 0:
                coil.rotate_from_angax(angle_x, 'x', anchor=(0,0,0))
                
            coils.append(coil)
            
            # Rotate vertices for accurate manual force integration
            theta = np.radians(angle_x)
            rot_vertices = []
            for vx, vy, vz in vertices:
                ny = vy * np.cos(theta) - vz * np.sin(theta)
                nz = vy * np.sin(theta) + vz * np.cos(theta)
                rot_vertices.append([vx, ny, nz])
            
            # Calculate forces for all coils with current
            if abs(amp_turns) > 1e-5:
                force_coil = np.zeros(3)
                force_top = np.zeros(3)
                force_bottom = np.zeros(3)
                for i in range(len(rot_vertices)-1):
                    p1 = np.array(rot_vertices[i]) + np.array(pos)
                    p2 = np.array(rot_vertices[i+1]) + np.array(pos)
                    points = np.linspace(p1, p2, 50)
                    dl = (p2 - p1) / 49 # dl vector
                    B_field = col_base.getB(points)
                    forces = amp_turns * np.cross(dl, B_field)
                    seg_force = np.sum(forces, axis=0)
                    force_coil += seg_force
                    
                    # Calculate Torque around X-axis: r x F
                    r_mid = (p1 + p2) / 2.0
                    t_x = r_mid[1] * seg_force[2] - r_mid[2] * seg_force[1]
                    total_torque_x += t_x
                    
                    if i == 0:
                        force_top = seg_force
                    elif i == 2:
                        force_bottom = seg_force
                    
                total_f_x += force_coil[0]
                total_f_y += force_coil[1]
                total_f_z += force_coil[2]
                b_data['force_top'] = force_top.copy()
                b_data['force_bottom'] = force_bottom.copy()

        col_all = magpy.Collection(col_base)
        for coil in coils:
            col_all.add(coil)
        
        img_base64 = None
        strm_base64 = None
        plotly_html = None
        
        if not calc_only:
            # Generate 3D visualization
            fig = plt.figure(figsize=(8, 6))
            ax = fig.add_subplot(111, projection='3d')
            # Display the full collection (magnets + coils)
            magpy.show(col_all, canvas=ax, backend='matplotlib')
            
            # Calculate max force for scaling
            max_f_3d = 0
            if bobinas_data:
                for b_data in bobinas_data:
                    if 'force_bottom' in b_data:
                        max_f_3d = max(max_f_3d, np.linalg.norm(b_data['force_bottom']), np.linalg.norm(b_data['force_top']))
            if max_f_3d == 0: max_f_3d = 1
            
            drawn_bot_3d = False
            drawn_top_3d = False
            
            if bobinas_data:
                for b_data in bobinas_data:
                    if 'force_bottom' in b_data:
                        ancho = b_data.get('dimension', [30, 30])[1]
                        hw = ancho / 2.0
                        theta = np.radians(b_data.get('angulo_x', 0))
                        
                        top_y = -hw * np.sin(theta)
                        top_z = hw * np.cos(theta)
                        bot_y = hw * np.sin(theta)
                        bot_z = -hw * np.cos(theta)
                        
                        f_bot = b_data['force_bottom']
                        f_top = b_data['force_top']
                        
                        f_bot_norm = np.linalg.norm(f_bot)
                        if f_bot_norm > 0:
                            f_bot_dir = f_bot / max_f_3d
                            lbl = "Fuerza (Conductor 1)" if not drawn_bot_3d else ""
                            # Length ajustado de 25 a 15 para no saturar visualmente
                            ax.quiver(0, bot_y, bot_z, f_bot_dir[0], f_bot_dir[1], f_bot_dir[2], color='#2ecc71', length=15, normalize=False, linewidth=4, arrow_length_ratio=0.35, label=lbl)
                            drawn_bot_3d = True
                            
                        f_top_norm = np.linalg.norm(f_top)
                        if f_top_norm > 0:
                            f_top_dir = f_top / max_f_3d
                            lbl = "Fuerza (Conductor 2)" if not drawn_top_3d else ""
                            ax.quiver(0, top_y, top_z, f_top_dir[0], f_top_dir[1], f_top_dir[2], color='#e74c3c', length=15, normalize=False, linewidth=4, arrow_length_ratio=0.35, label=lbl)
                            drawn_top_3d = True
                            
            if drawn_bot_3d or drawn_top_3d:
                ax.legend()
            
            # Enforce equal aspect ratio so geometry is not distorted
            set_axes_equal(ax)
            
            # Ajustar el ángulo de cámara para evitar la ilusión óptica de descentrado
            ax.view_init(elev=20, azim=35)
            
            buf = io.BytesIO()
            plt.savefig(buf, format='png', bbox_inches='tight', transparent=True)
            plt.close(fig)
            buf.seek(0)
            img_base64 = base64.b64encode(buf.read()).decode('utf-8')

            # --- GENERATE 2D STREAMLINE PLOT ---
            # magpy.show() scales the 3D plot to mm, so ax.get_ylim3d() returns values in mm
            y_min, y_max = ax.get_ylim3d()
            z_min, z_max = ax.get_zlim3d()
            
            ts_y_mm = np.linspace(y_min, y_max, 50)
            ts_z_mm = np.linspace(z_min, z_max, 50)
            
            # getB expects meters, so we must divide by 1000
            grid_m = np.array([[(0, y/1000.0, z/1000.0) for y in ts_y_mm] for z in ts_z_mm])
            
            B_grid = col_all.getB(grid_m)
            Y_grid_mm, Z_grid_mm = np.meshgrid(ts_y_mm, ts_z_mm)
            By = B_grid[:,:,1]
            Bz = B_grid[:,:,2]
            B_mag_2d = np.linalg.norm(B_grid[:,:,1:], axis=2)
            B_mag_2d[B_mag_2d == 0] = 1e-10 # prevent log(0)
            
            style_2d = data.get('style_2d', 'scifi')
            
            if style_2d == 'scifi':
                fig2, ax2 = plt.subplots(figsize=(7, 6))
                fig2.patch.set_facecolor('#0f172a')
                ax2.set_facecolor('#0f172a')
                ax2.set_title('Intensidad de Campo y Líneas (Corte Central)', color='white', pad=15)
                
                contour = ax2.contourf(Y_grid_mm, Z_grid_mm, np.log10(B_mag_2d), levels=100, cmap='magma', alpha=0.9)
                cbar = plt.colorbar(contour, ax=ax2, fraction=0.046, pad=0.04)
                cbar.set_label('Log10(B) [mT]', color='#cbd5e1')
                cbar.ax.yaxis.set_tick_params(color='#cbd5e1')
                plt.setp(plt.getp(cbar.ax.axes, 'yticklabels'), color='#cbd5e1')
                
                lw = 0.5 + 1.5 * (np.log10(B_mag_2d) - np.log10(B_mag_2d).min()) / (np.log10(B_mag_2d).max() - np.log10(B_mag_2d).min() + 1e-10)
                strm = ax2.streamplot(Y_grid_mm, Z_grid_mm, By, Bz, color='#ffffff88', density=1.4, linewidth=lw, arrowsize=1.2)
            elif style_2d == 'quiver':
                fig2, ax2 = plt.subplots(figsize=(7, 6))
                ax2.set_title('Vectores de Campo (Corte Central)', pad=15)
                By_norm = By / B_mag_2d
                Bz_norm = Bz / B_mag_2d
                skip = (slice(None, None, 2), slice(None, None, 2))
                q = ax2.quiver(Y_grid_mm[skip], Z_grid_mm[skip], By_norm[skip], Bz_norm[skip], np.log10(B_mag_2d)[skip], 
                               cmap='turbo', pivot='mid', scale=30, alpha=0.8, width=0.004)
                cbar = plt.colorbar(q, ax=ax2, fraction=0.046, pad=0.04)
                cbar.set_label('Log10(B) [mT]')
            else:
                fig2, ax2 = plt.subplots(figsize=(6, 6))
                strm = ax2.streamplot(Y_grid_mm, Z_grid_mm, By, Bz, color=np.log10(B_mag_2d), density=1.5, cmap='plasma')
            
            import matplotlib.patches as patches
            # Dibujar imán base en milímetros
            if imanes_base:
                m_dim_data = imanes_base[0].get('dimension')
                if m_dim_data is None: m_dim_data = [30, 15, 5]
                m_dim_mm = np.array(m_dim_data)
                
                m_pos_data = imanes_base[0].get('posicion')
                if m_pos_data is None: m_pos_data = [0, 0, -15]
                m_pos_mm = np.array(m_pos_data)
                rect_y = m_pos_mm[1] - m_dim_mm[1]/2
                rect_z = m_pos_mm[2] - m_dim_mm[2]/2
                
                if style_2d == 'scifi':
                    rect = patches.Rectangle((rect_y, rect_z), m_dim_mm[1], m_dim_mm[2], linewidth=2, edgecolor='#38bdf8', facecolor='#38bdf844')
                else:
                    rect = patches.Rectangle((rect_y, rect_z), m_dim_mm[1], m_dim_mm[2], linewidth=2, edgecolor='red', facecolor='none')
                ax2.add_patch(rect)
                
            # Dibujar cortes transversales de todas las espiras y sus fuerzas
            max_f_2d = 0
            if bobinas_data:
                for b_data in bobinas_data:
                    if 'force_bottom' in b_data:
                        f_bot_2d = np.linalg.norm([b_data['force_bottom'][1], b_data['force_bottom'][2]])
                        f_top_2d = np.linalg.norm([b_data['force_top'][1], b_data['force_top'][2]])
                        max_f_2d = max(max_f_2d, f_bot_2d, f_top_2d)
                if max_f_2d == 0: max_f_2d = 1
                
                drawn_bot_leg = False
                drawn_top_leg = False
                
                for b_data in bobinas_data:
                    ancho = b_data.get('dimension', [30, 30])[1]
                    hw = ancho / 2.0
                    angle_x = b_data.get('angulo_x', 0)
                    theta = np.radians(angle_x)
                    
                    # Coordenadas rotadas
                    top_y = -hw * np.sin(theta)
                    top_z = hw * np.cos(theta)
                    bot_y = hw * np.sin(theta)
                    bot_z = -hw * np.cos(theta)
                    
                    corriente_val = b_data.get('corriente', 0)
                    color = 'blue' if abs(corriente_val) > 1e-5 else 'gray'
                    
                    # Un valor de corriente > 0 en Magpylib significa que el cable superior tiene la corriente en dirección +X (hacia afuera, ⊙)
                    # y el cable inferior tiene la corriente en dirección -X (hacia adentro, ⊗).
                    # Por tanto, marcamos el top con 'o' y el bottom con 'x' si I > 0, y al revés si I < 0.
                    top_marker = 'o' if corriente_val >= 0 else 'x'
                    bot_marker = 'x' if corriente_val >= 0 else 'o'
                    
                    if top_marker == 'o':
                        ax2.plot([top_y], [top_z], 'o', color=color, markersize=8, fillstyle='none', markeredgewidth=2, zorder=10)
                        # Dibujar un punto dentro para hacer el símbolo de "punto" ⊙
                        ax2.plot([top_y], [top_z], '.', color=color, markersize=3, zorder=10)
                    else:
                        ax2.plot([top_y], [top_z], 'x', color=color, markersize=8, markeredgewidth=2, zorder=10)
                        
                    if bot_marker == 'o':
                        ax2.plot([bot_y], [bot_z], 'o', color=color, markersize=8, fillstyle='none', markeredgewidth=2, zorder=10)
                        ax2.plot([bot_y], [bot_z], '.', color=color, markersize=3, zorder=10)
                    else:
                        ax2.plot([bot_y], [bot_z], 'x', color=color, markersize=8, markeredgewidth=2, zorder=10)
                    
                    if 'force_bottom' in b_data:
                        f_bot_2d = np.array([b_data['force_bottom'][1], b_data['force_bottom'][2]])
                        f_top_2d = np.array([b_data['force_top'][1], b_data['force_top'][2]])
                        
                        f_bot_2d_norm = np.linalg.norm(f_bot_2d)
                        if f_bot_2d_norm > 0:
                            f_bot_dir = f_bot_2d / max_f_2d
                            ax2.arrow(bot_y, bot_z, f_bot_dir[0]*10, f_bot_dir[1]*10, color='#2ecc71', width=1.0, head_width=3, head_length=3, zorder=5)
                            if not drawn_bot_leg:
                                ax2.plot([], [], color='#2ecc71', label="Fuerza (Conductor 1)", linewidth=3)
                                drawn_bot_leg = True
                                
                        f_top_2d_norm = np.linalg.norm(f_top_2d)
                        if f_top_2d_norm > 0:
                            f_top_dir = f_top_2d / max_f_2d
                            ax2.arrow(top_y, top_z, f_top_dir[0]*10, f_top_dir[1]*10, color='#e74c3c', width=1.0, head_width=3, head_length=3, zorder=5)
                            if not drawn_top_leg:
                                ax2.plot([], [], color='#e74c3c', label="Fuerza (Conductor 2)", linewidth=3)
                                drawn_top_leg = True
                                
                if drawn_bot_leg or drawn_top_leg:
                    # Movemos la leyenda fuera del gráfico, abajo
                    ax2.legend(loc='upper center', bbox_to_anchor=(0.5, -0.12), ncol=2)

            # --- DIBUJAR PAR DE GIRO RESULTANTE ---
            if abs(total_torque_x) > 1e-7:
                from matplotlib.patches import FancyArrowPatch
                
                # Si total_torque_x > 0, el giro es Antihorario (de +Y a +Z). Si no, Horario.
                is_ccw = total_torque_x > 0
                rotation_dir = "Antihorario" if is_ccw else "Horario"
                color_torque = "#8e44ad" # Púrpura para diferenciarlo de las fuerzas
                
                # Coordenadas para el arco en el espacio Y-Z
                # Lo pondremos arriba del centro, haciendo una curva
                if is_ccw:
                    arrow = FancyArrowPatch((15, 20), (-15, 20), connectionstyle="arc3,rad=.3", 
                                            color=color_torque, arrowstyle="Simple, tail_width=2, head_width=8, head_length=10", zorder=20)
                else:
                    arrow = FancyArrowPatch((-15, 20), (15, 20), connectionstyle="arc3,rad=-.3", 
                                            color=color_torque, arrowstyle="Simple, tail_width=2, head_width=8, head_length=10", zorder=20)
                ax2.add_patch(arrow)
                
                # Texto con el valor, posicionado arriba de la gráfica (eje de coordenadas relativas)
                ax2.text(0.5, 1.02, f"Par Resultante: {abs(total_torque_x):.1e} N·m ({rotation_dir})", 
                         transform=ax2.transAxes, color=color_torque, fontsize=10, fontweight='bold', ha='center', va='bottom',
                         bbox=dict(facecolor='white', alpha=0.8, edgecolor=color_torque, boxstyle='round,pad=0.3'), zorder=20)

            # --- DIBUJAR RESULTANTE DE FUERZAS (CABECEO/DESPLAZAMIENTO) ---
            if abs(total_f_y) > 1e-7 or abs(total_f_z) > 1e-7:
                force_text = f"Fuerza Neta:\nLat (Y): {total_f_y:.1e} N\nVert (Z): {total_f_z:.1e} N"
                # Posicionado debajo de la leyenda, fuera de la gráfica
                ax2.text(0.5, -0.22, force_text, transform=ax2.transAxes, color='#e67e22', fontsize=9, fontweight='bold', ha='center', va='top',
                         bbox=dict(facecolor='white', alpha=0.9, edgecolor='#e67e22', boxstyle='round,pad=0.3'), zorder=20)

            ax2.set_aspect('equal')
            if style_2d == 'scifi':
                ax2.set_xlabel('Y (Ancho m)', color='#cbd5e1')
                ax2.set_ylabel('Z (Altura m)', color='#cbd5e1')
                ax2.tick_params(colors='#cbd5e1')
                for spine in ax2.spines.values():
                    spine.set_color('#334155')
            else:
                ax2.set_xlabel('Y (Ancho m)')
                ax2.set_ylabel('Z (Altura m)')
            
            buf2 = io.BytesIO()
            is_transparent = False if style_2d == 'scifi' else True
            plt.savefig(buf2, format='png', bbox_inches='tight', transparent=is_transparent)
            plt.close(fig2)
            buf2.seek(0)
            strm_base64 = base64.b64encode(buf2.read()).decode('utf-8')
            
            # --- GENERATE 3D INTERACTIVE PLOTLY WIDGET ---
            try:
                import plotly.graph_objects as go
                
                # Create a scaled-up collection for Plotly to match the [-30, 30] mm axis ranges
                col_vis = magpy.Collection()
                
                for iman in imanes_base:
                    dim_mm = iman.get('dimension')
                    if dim_mm is None: dim_mm = [10, 10, 10]
                    raw_pos = iman.get('posicion')
                    if raw_pos is None: raw_pos = [0, 0, 0]
                    clean_pos = [p if p is not None else 0.0 for p in raw_pos]
                    pol = iman.get('magnetizacion')
                    if pol is None: pol = [0, 0, 1000]
                    
                    magnet_vis = magpy.magnet.Cuboid(polarization=pol, dimension=dim_mm, position=clean_pos)
                    magnet_vis.style.magnetization.mode = "color"
                    magnet_vis.style.magnetization.color.north = "red"
                    magnet_vis.style.magnetization.color.south = "blue"
                    col_vis.add(magnet_vis)
                
                if bobinas_data:
                    for b_data in bobinas_data:
                        amp_turns = b_data.get('vueltas', 1) * b_data.get('corriente', 1.0)
                        dims_mm = b_data.get('dimension')
                        if dims_mm is None: dims_mm = [30, 30]
                        hl_mm = dims_mm[0] / 2.0
                        hw_mm = dims_mm[1] / 2.0
                        pos_mm = b_data.get('posicion')
                        if pos_mm is None: pos_mm = [0, 0, 0]
                        angle_x = b_data.get('angulo_x', 0)
                        
                        vertices_mm = [
                            [-hl_mm, 0, hw_mm],
                            [hl_mm, 0, hw_mm],
                            [hl_mm, 0, -hw_mm],
                            [-hl_mm, 0, -hw_mm],
                            [-hl_mm, 0, hw_mm]
                        ]
                        
                        color = 'blue' if abs(amp_turns) > 1e-5 else 'gray'
                        # Use a tiny current for visualization to prevent Magpylib from drawing gigantic arrows in Plotly
                        coil_vis = magpy.current.Polyline(current=1e-6, vertices=vertices_mm, position=pos_mm, style_color=color)
                        coil_vis.style.arrow.show = False
                        if angle_x != 0:
                            coil_vis.rotate_from_angax(angle_x, 'x', anchor=(0,0,0))
                        col_vis.add(coil_vis)

                fig_plotly = magpy.show(col_vis, return_fig=True, backend='plotly')
                
                if bobinas_data:
                    for b_data in bobinas_data:
                        if 'force_bottom' in b_data:
                            ancho = b_data.get('dimension', [30, 30])[1]
                            hw = ancho / 2.0
                            theta = np.radians(b_data.get('angulo_x', 0))
                            
                            top_y = -hw * np.sin(theta)
                            top_z = hw * np.cos(theta)
                            bot_y = hw * np.sin(theta)
                            bot_z = -hw * np.cos(theta)
                            
                            f_bot = b_data['force_bottom']
                            f_top = b_data['force_top']
                            
                            f_bot_norm = np.linalg.norm(f_bot)
                            if f_bot_norm > 0:
                                f_bot_dir = f_bot / max_f_3d * 15
                                fig_plotly.add_trace(go.Scatter3d(
                                    x=[0, f_bot_dir[0]], 
                                    y=[bot_y, bot_y + f_bot_dir[1]], 
                                    z=[bot_z, bot_z + f_bot_dir[2]],
                                    mode='lines',
                                    line=dict(color='#2ecc71', width=6),
                                    name="Fuerza (Conductor 1)"
                                ))
                                fig_plotly.add_trace(go.Cone(
                                    x=[f_bot_dir[0]], y=[bot_y + f_bot_dir[1]], z=[bot_z + f_bot_dir[2]],
                                    u=[f_bot_dir[0]], v=[f_bot_dir[1]], w=[f_bot_dir[2]],
                                    sizemode='absolute', sizeref=5, showscale=False,
                                    colorscale=[[0, '#2ecc71'], [1, '#2ecc71']],
                                    name="Fuerza (Conductor 1) Dir"
                                ))
                                
                            f_top_norm = np.linalg.norm(f_top)
                            if f_top_norm > 0:
                                f_top_dir = f_top / max_f_3d * 15
                                fig_plotly.add_trace(go.Scatter3d(
                                    x=[0, f_top_dir[0]], 
                                    y=[top_y, top_y + f_top_dir[1]], 
                                    z=[top_z, top_z + f_top_dir[2]],
                                    mode='lines',
                                    line=dict(color='#e74c3c', width=6),
                                    name="Fuerza (Conductor 2)"
                                ))
                                fig_plotly.add_trace(go.Cone(
                                    x=[f_top_dir[0]], y=[top_y + f_top_dir[1]], z=[top_z + f_top_dir[2]],
                                    u=[f_top_dir[0]], v=[f_top_dir[1]], w=[f_top_dir[2]],
                                    sizemode='absolute', sizeref=5, showscale=False,
                                    colorscale=[[0, '#e74c3c'], [1, '#e74c3c']],
                                    name="Fuerza (Conductor 2) Dir"
                                ))
                
                fig_plotly.update_layout(
                    scene=dict(
                        aspectmode='data'
                    ),
                    margin=dict(l=0, r=0, b=0, t=0),
                    showlegend=False
                )
                plotly_html = fig_plotly.to_html(full_html=False, include_plotlyjs='cdn')
            except Exception as e:
                print(f"Plotly error: {e}")

        return jsonify({
            'status': 'success',
            'force_vector': [float(total_f_x), float(total_f_y), float(total_f_z)],
            'torque_x': float(total_torque_x),
            'b_field': [float(B_center[0]), float(B_center[1]), float(B_center[2])],
            'image_base64': img_base64,
            'streamplot_base64': strm_base64,
            'plotly_html': plotly_html
        })
        
    except Exception as e:
        print(f"Error en el servidor: {e}")
        import traceback
        traceback.print_exc()
        with open('magpylib_error.log', 'w') as f:
            f.write(str(e) + '\n')
            f.write(traceback.format_exc())
        return jsonify({'status': 'error', 'message': str(e)}), 500
@app.route('/api/magpylib-levitation', methods=['POST'])
def calculate_levitation():
    try:
        data = request.json
        base_mags_data = data.get('imanes_sustentacion', [])
        rotor_mags_data = data.get('imanes_rotor', [])
        weight_N = data.get('rotor_weight_N', 0)
        
        if not base_mags_data or not rotor_mags_data:
            return jsonify({"error": "Faltan datos de geometría"}), 400
            

        base_magnets = []
        for iman in base_mags_data:
            pos = iman.get('posicion', [0,0,0])
            dim = iman.get('dimension', [10,10,10])
            pol_mT = iman.get('magnetizacion', [0,0,1000])
            b_mag = magpy.magnet.Cuboid(
                polarization=pol_mT,
                dimension=np.array(dim) * 1e-3,
                position=np.array(pos) * 1e-3
            )
            if 'rotacion' in iman:
                rot = iman['rotacion']
                b_mag.rotate_from_angax(rot['angle'], rot['axis'], anchor=np.array(rot['anchor'])*1e-3)
                
            b_mag.style.magnetization.mode = "color"
            b_mag.style.magnetization.color.north = "red"
            b_mag.style.magnetization.color.south = "blue"
            
            base_magnets.append(b_mag)
            
        col_base = magpy.Collection(base_magnets)
        
        def get_force_z(z_height):
            total_fz = 0.0
            for rm in rotor_mags_data:
                pos_x = rm.get('x', 0)
                pos_y = rm.get('y', 0)
                r = rm.get('r', 10)
                w = rm.get('w', 5)
                pol_x_mT = rm.get('pol_x', 1200) # mT
                pol_x_T = pol_x_mT / 1000.0 # T
                
                K = pol_x_T / (4 * np.pi * 1e-7)
                I_total = K * (w * 1e-3)
                N_loops = 5
                I_loop = I_total / N_loops
                N_segments = 36
                angles = np.linspace(0, 2*np.pi, N_segments+1)
                
                for i in range(N_loops):
                    x_offset = -w/2 + (i + 0.5) * (w / N_loops)
                    x_pt = (pos_x + x_offset) * 1e-3
                    y_c = pos_y * 1e-3
                    z_c = z_height * 1e-3
                    
                    R = r * 1e-3
                    pts = []
                    for a in angles:
                        pts.append([x_pt, y_c + R*np.cos(a), z_c + R*np.sin(a)])
                    pts = np.array(pts)
                    dl = pts[1:] - pts[:-1]
                    mid_pts = (pts[1:] + pts[:-1]) / 2.0
                    
                    B_field_mT = col_base.getB(mid_pts)
                    B_field_T = B_field_mT / 1000.0 # Convertir mT a T
                    forces = I_loop * np.cross(dl, B_field_T)
                    total_fz += np.sum(forces[:, 2])
            return total_fz

        z_min = 0.0
        z_max = 300.0
        def generate_vis(z_vis):
            img_b64, plotly_h, strm_b64 = None, None, None
            col_v = magpy.Collection(col_base)
            for rm in rotor_mags_data:
                p_x, p_y = rm.get('x', 0), rm.get('y', 0)
                r, w = rm.get('r', 10), rm.get('w', 5)
                pol_x_mT = rm.get('pol_x', 1200)
                r_mag = magpy.magnet.Cylinder(
                    # Polarización axial inicial en Z, al rotar 90º en Y pasará a estar en X
                    polarization=[0, 0, pol_x_mT],
                    dimension=[2*r*1e-3, w*1e-3],
                    position=[p_x*1e-3, p_y*1e-3, z_vis*1e-3]
                )
                r_mag.rotate_from_angax(90, 'y')
                r_mag.style.magnetization.mode = "color"
                r_mag.style.magnetization.color.north = "red"
                r_mag.style.magnetization.color.south = "blue"
                col_v.add(r_mag)

            # --- DIBUJAR CUERPO DEL ROTOR ---
            rotor_body = data.get('rotor_body', {})
            rb_d = rotor_body.get('diametro', 20)
            rb_l = rotor_body.get('longitud', 30)
            if rb_d > 0 and rb_l > 0:
                r_body = magpy.magnet.Cylinder(
                    polarization=[0, 0, 0],
                    dimension=[rb_d*1e-3, rb_l*1e-3],
                    position=[0, 0, z_vis*1e-3]
                )
                r_body.rotate_from_angax(90, 'y')
                r_body.style.color = "#93c5fd" # Light blue like SVG
                r_body.style.opacity = 0.5
                r_body.style.magnetization.show = False
                col_v.add(r_body)

            # --- DIBUJAR EJE DEL ROTOR ---
            shaft = data.get('shaft', {})
            s_d = shaft.get('diametro', 8)
            s_l = shaft.get('longitud', 120)
            if s_d > 0 and s_l > 0:
                s_body = magpy.magnet.Cylinder(
                    polarization=[0, 0, 0],
                    dimension=[s_d*1e-3, s_l*1e-3],
                    position=[0, 0, z_vis*1e-3]
                )
                s_body.rotate_from_angax(90, 'y')
                s_body.style.color = "#cbd5e1" # Slate color
                s_body.style.opacity = 0.8
                s_body.style.magnetization.show = False
                col_v.add(s_body)

            # --- DIBUJAR BASE ---
            # base_plate = data.get('base_plate', {})
            # bp_x = base_plate.get('x', 120)
            # bp_y = base_plate.get('y', 80)
            # bp_z = base_plate.get('z_pos', -15)
            # if bp_x > 0 and bp_y > 0:
            #     bp_body = magpy.magnet.Cuboid(
            #         polarization=[0, 0, 0],
            #         dimension=[bp_x*1e-3, bp_y*1e-3, 5*1e-3], # 5mm thickness
            #         position=[0, 0, bp_z*1e-3]
            #     )
            #     bp_body.style.color = "#f1f5f9" # Light gray
            #     bp_body.style.opacity = 0.9
            #     bp_body.style.magnetization.show = False
            #     col_v.add(bp_body)


            try:
                f_p = magpy.show(col_v, return_fig=True, backend='plotly')
                # Vista isométrica ortográfica para evitar distorsión de perspectiva
                f_p.update_layout(
                    scene_camera=dict(
                        eye=dict(x=0.8, y=-2.2, z=1.0), 
                        up=dict(x=0, y=0, z=1)
                    ), 
                    scene=dict(aspectmode='data'), 
                    margin=dict(l=0,r=0,b=0,t=0), 
                    showlegend=False
                )
                plotly_h = f_p.to_html(full_html=False, include_plotlyjs='cdn')
            except Exception as e: print("Plotly error:", e)

            fig = plt.figure(figsize=(8, 6))
            ax = fig.add_subplot(111, projection='3d')
            magpy.show(col_v, canvas=ax, backend='matplotlib')
            set_axes_equal(ax)
            # Vista para que se aprecie bien el perfil Y-Z y un poco de profundidad X
            ax.view_init(elev=20, azim=-60)
            buf = io.BytesIO()
            plt.savefig(buf, format='png', bbox_inches='tight', transparent=True)
            plt.close(fig)
            buf.seek(0)
            img_b64 = base64.b64encode(buf.read()).decode('utf-8')
            
            # --- 2D STREAMLINE PLOT (Y-Z plane) ---
            try:
                y_min, y_max = ax.get_ylim3d()
                z_min_plt, z_max_plt = ax.get_zlim3d()
                ts_y_mm = np.linspace(y_min, y_max, 60)
                ts_z_mm = np.linspace(z_min_plt, z_max_plt, 60)
                
                # Tomamos la posición X de los imanes de la izquierda para el plano de corte
                # Como la magnetización es a lo largo de X, en X=0 (centro del imán) By y Bz son nulos.
                # Desplazamos el corte 4mm hacia afuera para ver las líneas de campo curvándose (fringing field).
                x_slice_mm = 0.0
                if len(base_mags_data) > 0:
                    x_centro = base_mags_data[0].get('posicion', [0,0,0])[0]
                    dim_x = base_mags_data[0].get('dimension', [5,10,20])[0]
                    x_slice_mm = x_centro + (dim_x / 2.0) + 4.0
                    
                grid_m = np.array([[(x_slice_mm/1000.0, y/1000.0, z/1000.0) for y in ts_y_mm] for z in ts_z_mm])
                B_grid = col_v.getB(grid_m)
                Y_grid_mm, Z_grid_mm = np.meshgrid(ts_y_mm, ts_z_mm)
                By = np.nan_to_num(B_grid[:,:,1])
                Bz = np.nan_to_num(B_grid[:,:,2])
                B_mag_2d = np.linalg.norm(np.stack((By, Bz), axis=-1), axis=2)
                B_mag_2d[B_mag_2d <= 0] = 1e-10
                
                style_2d = data.get('style_2d', 'scifi')
                
                if style_2d == 'scifi':
                    fig2, ax2 = plt.subplots(figsize=(7, 6))
                    fig2.patch.set_facecolor('#0f172a')
                    ax2.set_facecolor('#0f172a')
                    ax2.set_title(f"Intensidad de Campo y Líneas (Corte X={x_slice_mm:.1f} mm)", color='white', pad=15)
                    
                    contour = ax2.contourf(Y_grid_mm, Z_grid_mm, np.log10(B_mag_2d), levels=100, cmap='magma', alpha=0.9)
                    cbar = plt.colorbar(contour, ax=ax2, fraction=0.046, pad=0.04)
                    cbar.set_label('Log10(B) [mT]', color='#cbd5e1')
                    cbar.ax.yaxis.set_tick_params(color='#cbd5e1')
                    plt.setp(plt.getp(cbar.ax.axes, 'yticklabels'), color='#cbd5e1')
                    
                    lw = 0.5 + 1.5 * (np.log10(B_mag_2d) - np.log10(B_mag_2d).min()) / (np.log10(B_mag_2d).max() - np.log10(B_mag_2d).min() + 1e-10)
                    ax2.streamplot(Y_grid_mm, Z_grid_mm, By, Bz, color='rgba(255,255,255,0.6)' if False else '#ffffff88', density=1.4, linewidth=lw, arrowsize=1.2)
                elif style_2d == 'quiver':
                    fig2, ax2 = plt.subplots(figsize=(7, 6))
                    ax2.set_title(f"Vectores de Campo (Corte Y-Z en X={x_slice_mm:.1f} mm)", pad=15)
                    
                    # Normalizamos los vectores para hacerlos como limaduras de hierro (dirección pura)
                    By_norm = By / B_mag_2d
                    Bz_norm = Bz / B_mag_2d
                    
                    # Saltamos algunos puntos para que no se sature de flechas
                    skip = (slice(None, None, 2), slice(None, None, 2))
                    
                    # Coloreamos por intensidad logarítmica
                    q = ax2.quiver(Y_grid_mm[skip], Z_grid_mm[skip], By_norm[skip], Bz_norm[skip], np.log10(B_mag_2d)[skip], 
                                   cmap='turbo', pivot='mid', scale=30, alpha=0.8, width=0.004)
                                   
                    cbar = plt.colorbar(q, ax=ax2, fraction=0.046, pad=0.04)
                    cbar.set_label('Log10(B) [mT]')
                else:
                    fig2, ax2 = plt.subplots(figsize=(6, 6))
                    ax2.set_title(f"Líneas de Campo (Corte Y-Z en X={x_slice_mm:.1f} mm)")
                    ax2.streamplot(Y_grid_mm, Z_grid_mm, By, Bz, color=np.log10(B_mag_2d), density=1.5, cmap='plasma')
                
                # Dibujar los imanes para referencia
                for iman in base_mags_data:
                    pos = iman.get('posicion', [0,0,0])
                    dim = iman.get('dimension', [5,10,20]) # X, Y, Z
                    rot = iman.get('rotacion', {'angle':0, 'anchor':[0,0,0]})
                    
                    cy, cz = pos[1], pos[2]
                    w, h = dim[1], dim[2]
                    
                    # 4 esquinas del rectángulo en Y-Z
                    corners = np.array([
                        [cy - w/2, cz - h/2],
                        [cy + w/2, cz - h/2],
                        [cy + w/2, cz + h/2],
                        [cy - w/2, cz + h/2]
                    ])
                    
                    ay, az = rot['anchor'][1], rot['anchor'][2]
                    theta = np.radians(rot['angle'])
                    cos_t, sin_t = np.cos(theta), np.sin(theta)
                    
                    rot_corners = []
                    for y, z in corners:
                        dy, dz = y - ay, z - az
                        ny = ay + dy * cos_t - dz * sin_t
                        nz = az + dy * sin_t + dz * cos_t
                        rot_corners.append([ny, nz])
                        
                    rot_corners.append(rot_corners[0]) # cerrar poligono
                    rot_corners = np.array(rot_corners)
                    
                    if style_2d == 'scifi':
                        poly = plt.Polygon(rot_corners, facecolor='#38bdf844', edgecolor='#38bdf8', linewidth=2)
                        ax2.add_patch(poly)
                    else:
                        ax2.plot(rot_corners[:, 0], rot_corners[:, 1], color='gray', linewidth=2)
                
                # Dibujar rotor magnets
                for rm in rotor_mags_data:
                    pos_y = rm.get('y', 0)
                    r = rm.get('r', 10)
                    if style_2d == 'scifi':
                        circle = plt.Circle((pos_y, z_vis), r, facecolor='#22c55e44', edgecolor='#22c55e', linewidth=2)
                    else:
                        circle = plt.Circle((pos_y, z_vis), r, color='green', fill=False, linewidth=2)
                    ax2.add_patch(circle)

                ax2.set_aspect('equal')
                if style_2d == 'scifi':
                    ax2.set_xlabel('Y (Ancho mm)', color='#cbd5e1')
                    ax2.set_ylabel('Z (Altura mm)', color='#cbd5e1')
                    ax2.tick_params(colors='#cbd5e1')
                    for spine in ax2.spines.values():
                        spine.set_color('#334155')
                else:
                    ax2.set_xlabel('Y (Ancho mm)')
                    ax2.set_ylabel('Z (Altura mm)')
                    ax2.set_title('Líneas de Campo Magnético (Corte Central)')
                
                buf2 = io.BytesIO()
                is_transparent = False if style_2d == 'scifi' else True
                plt.savefig(buf2, format='png', bbox_inches='tight', transparent=is_transparent)
                plt.close(fig2)
                buf2.seek(0)
                strm_b64 = base64.b64encode(buf2.read()).decode('utf-8')
            except Exception as e:
                print("Streamplot error:", e)
                
            return img_b64, plotly_h, strm_b64

        f_max_repulsion = get_force_z(z_min)
        if f_max_repulsion < weight_N:
            img, pl, strm = generate_vis(z_min)
            return jsonify({
                'status': 'success',
                'levita': False,
                'max_fuerza': float(f_max_repulsion),
                'mensaje': f'El rotor es demasiado pesado o la repulsión es muy débil (Fuerza max {f_max_repulsion:.2f} N vs Peso {weight_N:.2f} N).',
                'image_base64': img,
                'plotly_html': pl,
                'streamplot_base64': strm
            })
            
        for _ in range(35):
            z_mid = (z_min + z_max) / 2.0
            f_z = get_force_z(z_mid)
            if f_z > weight_N: z_min = z_mid
            else: z_max = z_mid
                
        equilibrio_z = (z_min + z_max) / 2.0
        img_base64, plotly_html, strm_base64 = generate_vis(equilibrio_z)

        return jsonify({
            'status': 'success',
            'levita': True,
            'equilibrio_z': float(equilibrio_z),
            'fuerza_neta': float(weight_N),
            'image_base64': img_base64,
            'plotly_html': plotly_html,
            'streamplot_base64': strm_base64
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/magpylib-global', methods=['POST'])
def calculate_global_forces():
    try:
        data = request.json
        imanes_base = data.get('imanes_base', [])
        imanes_sustentacion = data.get('imanes_sustentacion', [])
        imanes_rotor = data.get('imanes_rotor', [])
        bobinas_data = data.get('bobinas', [])
        style_2d = data.get('style_2d', 'scifi')
        
        all_magnets = []
        
        # 1. Imán de Inducción
        for iman in imanes_base:
            dim_mm = iman.get('dimension')
            if dim_mm is None: dim_mm = [10, 10, 10]
            pos_mm = iman.get('posicion')
            if pos_mm is None: pos_mm = [0, 0, 0]
            clean_pos_base = [p if p is not None else 0.0 for p in pos_mm]
            pol_mT = iman.get('magnetizacion')
            if pol_mT is None: pol_mT = [0, 0, 1000]
            b_mag = magpy.magnet.Cuboid(
                polarization=pol_mT,
                dimension=np.array(dim_mm) * 1e-3,
                position=np.array(clean_pos_base) * 1e-3
            )
            b_mag.style.color = "#38bdf8"
            all_magnets.append(b_mag)
            
        # 2. Imanes de Sustentación (Levitación)
        for iman in imanes_sustentacion:
            dim = iman.get('dimension')
            if dim is None: dim = [10, 10, 10]
            pos = iman.get('posicion')
            if pos is None: pos = [0, 0, 0]
            clean_pos_sust = [p if p is not None else 0.0 for p in pos]
            pol_mT = iman.get('magnetizacion')
            if pol_mT is None: pol_mT = [0, 0, 1000]
            b_mag = magpy.magnet.Cuboid(
                polarization=pol_mT,
                dimension=np.array(dim) * 1e-3,
                position=np.array(clean_pos_sust) * 1e-3
            )
            if 'rotacion' in iman and iman['rotacion'] is not None:
                rot = iman['rotacion']
                b_mag.rotate_from_angax(rot['angle'], rot['axis'], anchor=np.array(rot['anchor'])*1e-3)
            b_mag.style.color = "#818cf8"
            all_magnets.append(b_mag)
            
        # 3. Imanes del Rotor (Aros/Cilindros rotados en Y)
        for rm in imanes_rotor:
            p_x = rm.get('x'); p_x = p_x if p_x is not None else 0
            p_y = rm.get('y'); p_y = p_y if p_y is not None else 0
            z_vis = rm.get('z'); z_vis = z_vis if z_vis is not None else 20
            r = rm.get('r'); r = r if r is not None else 10
            w = rm.get('w'); w = w if w is not None else 5
            pol_x_mT = rm.get('pol_x'); pol_x_mT = pol_x_mT if pol_x_mT is not None else 1200
            
            r_mag = magpy.magnet.Cylinder(
                polarization=[0, 0, pol_x_mT],
                dimension=[2*r*1e-3, w*1e-3],
                position=[p_x*1e-3, p_y*1e-3, z_vis*1e-3]
            )
            r_mag.rotate_from_angax(90, 'y')
            r_mag.style.color = "#34d399"
            all_magnets.append(r_mag)
            
        # Aplicar colores de magnetización rojo/azul a todos los imanes
        for mag in all_magnets:
            mag.style.magnetization.mode = "color"
            mag.style.magnetization.color.north = "red"
            mag.style.magnetization.color.south = "blue"
            
        col_imanes = magpy.Collection(all_magnets)
        
        # 4. Bobinas
        bobinas_vis = []
        total_torque_x = 0.0
        total_f_x = 0.0
        total_f_y = 0.0
        total_f_z = 0.0
        
        for b_data in bobinas_data:
            current_A = b_data.get('corriente', 0)
            turns = b_data.get('vueltas', 1)
            total_current = current_A * turns
            
            dims = b_data.get('dimension')
            if dims is None: dims = [30, 30]
            hl = dims[0] / 2.0
            hw = dims[1] / 2.0
            
            pos = b_data.get('posicion')
            if pos is None: pos = [0, 0, 0]
            clean_pos_bobina = [p if p is not None else 0.0 for p in pos]
            angle_x = b_data.get('angulo_x', 0)
            
            # Espira 3D: P1(Izq,Aba) -> P2(Der,Aba) -> P3(Der,Arr) -> P4(Izq,Arr) -> P1
            vertices_mm = [
                [-hl, 0, hw],
                [hl, 0, hw],
                [hl, 0, -hw],
                [-hl, 0, -hw],
                [-hl, 0, hw]
            ]
            
            poly = magpy.current.Polyline(
                current=total_current,
                vertices=np.array(vertices_mm) * 1e-3,
                position=np.array(clean_pos_bobina) * 1e-3
            )
            anchor_pt = np.array(clean_pos_bobina) * 1e-3
            if angle_x != 0:
                poly.rotate_from_angax(angle_x, 'x', anchor=anchor_pt)
                
            if abs(total_current) > 1e-5:
                poly.style.color = '#ff6600'
                poly.style.line.width = 5
            else:
                poly.style.color = 'gray'
                poly.style.line.width = 2
                
            bobinas_vis.append(poly)
            
            # Muestrear a lo largo del hilo para Lorentz discreto
            N_segs = 20
            wire_pts = []
            wire_vecs = []
            v_rot = poly.vertices
            for i in range(len(v_rot)-1):
                p_start = v_rot[i]
                p_end = v_rot[i+1]
                vec = p_end - p_start
                for j in range(N_segs):
                    mid_p = p_start + vec * (j + 0.5) / N_segs
                    wire_pts.append(mid_p)
                    wire_vecs.append(vec / N_segs)
                    
            B_at_wire = col_imanes.getB(wire_pts)
            Forces = np.cross(wire_vecs, B_at_wire) * total_current
            
            # Torque = r x F
            r_vecs = np.array(wire_pts) - anchor_pt
            Torques = np.cross(r_vecs, Forces)
            
            total_torque_x += np.sum(Torques[:, 0])
            total_f_x += np.sum(Forces[:, 0])
            total_f_y += np.sum(Forces[:, 1])
            total_f_z += np.sum(Forces[:, 2])

        for b in bobinas_vis:
            col_imanes.add(b)
            
        # --- AÑADIR GEOMETRÍAS VISUALES ---
        # Cuerpo del rotor
        rotor_body = data.get('rotor_body', {})
        rb_d = rotor_body.get('diametro', 0)
        rb_l = rotor_body.get('longitud', 0)
        rb_z = rotor_body.get('z_pos', 20)
        if rb_d > 0 and rb_l > 0:
            r_body = magpy.magnet.Cylinder(
                polarization=[0, 0, 0],
                dimension=[rb_d*1e-3, rb_l*1e-3],
                position=[0, 0, rb_z*1e-3]
            )
            r_body.rotate_from_angax(90, 'y')
            r_body.style.color = "#93c5fd"
            r_body.style.opacity = 0.5
            r_body.style.magnetization.show = False
            col_imanes.add(r_body)

        # Eje del rotor
        shaft = data.get('shaft', {})
        s_d = shaft.get('diametro', 0)
        s_l = shaft.get('longitud', 0)
        s_z = shaft.get('z_pos', 20)
        if s_d > 0 and s_l > 0:
            s_body = magpy.magnet.Cylinder(
                polarization=[0, 0, 0],
                dimension=[s_d*1e-3, s_l*1e-3],
                position=[0, 0, s_z*1e-3]
            )
            s_body.rotate_from_angax(90, 'y')
            s_body.style.color = "#cbd5e1"
            s_body.style.opacity = 0.8
            s_body.style.magnetization.show = False
            col_imanes.add(s_body)

        # Base de apoyo (ocultada visualmente para que el bounding box de Plotly sea más ajustado al motor
        # y no aleje tanto la cámara, evitando el efecto 'espagueti' en el eje Y)
        # base_plate = data.get('base_plate', {})
        # bp_x = base_plate.get('x', 0)
        # bp_y = base_plate.get('y', 0)
        # bp_z = base_plate.get('z_pos', -2.5)
        # if bp_x > 0 and bp_y > 0:
        #     bp_body = magpy.magnet.Cuboid(
        #         polarization=[0, 0, 0],
        #         dimension=[bp_x*1e-3, bp_y*1e-3, 5*1e-3],
        #         position=[0, 0, bp_z*1e-3]
        #     )
        #     bp_body.style.color = "#f1f5f9"
        #     bp_body.style.opacity = 0.4
        #     bp_body.style.magnetization.show = False
        #     col_imanes.add(bp_body)
        
        # --- PLOTLY 3D ---
        plotly_html = ""
        try:
            f_p = magpy.show(col_imanes, return_fig=True, backend='plotly')
            f_p.update_layout(
                scene_camera=dict(
                    eye=dict(x=0.8, y=-2.2, z=1.0), 
                    up=dict(x=0, y=0, z=1)
                ), 
                scene=dict(aspectmode='data'), 
                margin=dict(l=0,r=0,b=0,t=0), 
                showlegend=False
            )
            plotly_html = f_p.to_html(full_html=False, include_plotlyjs='cdn')
        except Exception as e: print("Plotly error:", e)

        # --- GENERATE 2D PLOTS ---
        strm_base64_xz = ""
        strm_base64_xy_base = ""
        strm_base64_xy_rotor = ""
        try:
            import matplotlib.pyplot as plt
            import io
            import base64
            
            # Separar colecciones para las vistas
            col_estator = magpy.Collection()
            col_rotor_only = magpy.Collection()
            
            # Repopular para separar
            for i in range(len(imanes_base) + len(imanes_sustentacion)):
                col_estator.add(all_magnets[i].copy())
                
            for i in range(len(imanes_base) + len(imanes_sustentacion), len(all_magnets)):
                col_rotor_only.add(all_magnets[i].copy())
                
            for b in bobinas_vis:
                col_rotor_only.add(b.copy())
            
            x_min, x_max = -120, 120
            y_min_top, y_max_top = -60, 60
            z_min, z_max = -30, 50
            
            ts_x_mm = np.linspace(x_min, x_max, 100)
            ts_z_mm = np.linspace(z_min, z_max, 60)
            ts_y_mm = np.linspace(y_min_top, y_max_top, 60)
            
            # 1. Vista Lateral X-Z (Global)
            grid_xz = np.array([[(x/1000.0, 0, z/1000.0) for x in ts_x_mm] for z in ts_z_mm])
            B_grid_xz = col_imanes.getB(grid_xz)
            X_grid_xz, Z_grid_xz = np.meshgrid(ts_x_mm, ts_z_mm)
            Bx_xz = B_grid_xz[:,:,0]
            Bz_xz = B_grid_xz[:,:,2]
            B_mag_xz = np.linalg.norm(B_grid_xz[:,:,(0,2)], axis=2)
            B_mag_xz[B_mag_xz == 0] = 1e-10
            
            def generar_streamplot(X, Y, B1, B2, B_mag, title, xlabel, ylabel, cmap_colors):
                fig, ax = plt.subplots(figsize=(9, 5))
                if style_2d == 'scifi':
                    fig.patch.set_facecolor('#0f172a')
                    ax.set_facecolor('#0f172a')
                    ax.set_title(title, color='white', pad=15)
                    contour = ax.contourf(X, Y, np.log10(B_mag), levels=100, cmap='magma', alpha=0.9)
                    cbar = plt.colorbar(contour, ax=ax, fraction=0.046, pad=0.04)
                    cbar.set_label('Log10(B) [mT]', color='#cbd5e1')
                    cbar.ax.yaxis.set_tick_params(color='#cbd5e1')
                    plt.setp(plt.getp(cbar.ax.axes, 'yticklabels'), color='#cbd5e1')
                    
                    lw = 0.5 + 1.5 * (np.log10(B_mag) - np.log10(B_mag).min()) / (np.log10(B_mag).max() - np.log10(B_mag).min() + 1e-10)
                    ax.streamplot(X, Y, B1, B2, color='#ffffff88', density=1.4, linewidth=lw, arrowsize=1.2)
                    
                    ax.set_xlabel(xlabel, color='#cbd5e1')
                    ax.set_ylabel(ylabel, color='#cbd5e1')
                    ax.tick_params(colors='#cbd5e1')
                    for spine in ax.spines.values():
                        spine.set_color('#334155')
                    transparent = False
                elif style_2d == 'quiver':
                    ax.set_title(title, pad=15)
                    B1_norm = B1 / B_mag
                    B2_norm = B2 / B_mag
                    skip = (slice(None, None, 2), slice(None, None, 2))
                    q = ax.quiver(X[skip], Y[skip], B1_norm[skip], B2_norm[skip], np.log10(B_mag)[skip], 
                                   cmap='turbo', pivot='mid', scale=30, alpha=0.8, width=0.004)
                    cbar = plt.colorbar(q, ax=ax, fraction=0.046, pad=0.04)
                    cbar.set_label('Log10(B) [mT]')
                    ax.set_xlabel(xlabel)
                    ax.set_ylabel(ylabel)
                    transparent = True
                else:
                    ax.set_title(title, pad=15)
                    ax.streamplot(X, Y, B1, B2, color=np.log10(B_mag), density=1.5, cmap='plasma')
                    ax.set_xlabel(xlabel)
                    ax.set_ylabel(ylabel)
                    transparent = True
                    
                ax.set_aspect('equal')
                buf = io.BytesIO()
                plt.savefig(buf, format='png', bbox_inches='tight', transparent=transparent)
                plt.close(fig)
                buf.seek(0)
                return base64.b64encode(buf.read()).decode('utf-8')
                
            strm_base64_xz = generar_streamplot(X_grid_xz, Z_grid_xz, Bx_xz, Bz_xz, B_mag_xz, 'Vista Lateral Global (Plano X-Z)', 'X (Longitud mm)', 'Z (Altura mm)', 'magma')
            
            # 2. Vista Superior X-Y (Estator) a la altura del rotor (z=20)
            rotor_z = data.get('rotor_body', {}).get('z_pos', 20)
            grid_xy_est = np.array([[(x/1000.0, y/1000.0, rotor_z/1000.0) for x in ts_x_mm] for y in ts_y_mm])
            B_grid_xy_est = col_estator.getB(grid_xy_est)
            X_grid_xy, Y_grid_xy = np.meshgrid(ts_x_mm, ts_y_mm)
            Bx_xy_est = B_grid_xy_est[:,:,0]
            By_xy_est = B_grid_xy_est[:,:,1]
            B_mag_xy_est = np.linalg.norm(B_grid_xy_est[:,:,(0,1)], axis=2)
            B_mag_xy_est[B_mag_xy_est == 0] = 1e-10
            
            strm_base64_xy_base = generar_streamplot(X_grid_xy, Y_grid_xy, Bx_xy_est, By_xy_est, B_mag_xy_est, 'Vista Superior: Imán Base y Levitación (Plano X-Y)', 'X (Longitud mm)', 'Y (Ancho mm)', 'magma')
            
            # 3. Vista Superior X-Y (Solo Rotor) a la altura del rotor (z=20)
            B_grid_xy_rot = col_rotor_only.getB(grid_xy_est)
            Bx_xy_rot = B_grid_xy_rot[:,:,0]
            By_xy_rot = B_grid_xy_rot[:,:,1]
            B_mag_xy_rot = np.linalg.norm(B_grid_xy_rot[:,:,(0,1)], axis=2)
            B_mag_xy_rot[B_mag_xy_rot == 0] = 1e-10
            
            strm_base64_xy_rotor = generar_streamplot(X_grid_xy, Y_grid_xy, Bx_xy_rot, By_xy_rot, B_mag_xy_rot, 'Vista Superior: Solo Rotor y Bobinas (Plano X-Y)', 'X (Longitud mm)', 'Y (Ancho mm)', 'magma')

        except Exception as e:
            print("Matplotlib error:", e)

        return jsonify({
            'status': 'success',
            'torque_x': float(total_torque_x),
            'force_vector': [float(total_f_x), float(total_f_y), float(total_f_z)],
            'plotly_html': plotly_html,
            'streamplot_base64': strm_base64_xz,
            'streamplot_base64_xy_base': strm_base64_xy_base,
            'streamplot_base64_xy_rotor': strm_base64_xy_rotor
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/magpylib-tesla', methods=['POST'])
def calculate_tesla_coil():
    try:
        data = request.json
        sec_data = data.get('secondary', {})
        pri_data = data.get('primary', {})
        c_topload = data.get('topload_capacitance_pF', 0)
        
        # Sec parameters
        r_sec = sec_data.get('radius_mm', 55)
        h_sec = sec_data.get('height_mm', 435)
        n_sec = sec_data.get('turns', 1827)
        rw_sec = sec_data.get('wire_radius_mm', 0.1)
        
        # Pri parameters
        r_pri = pri_data.get('radius_mm', 100)
        h_pri = pri_data.get('height_mm', 50)
        n_pri = pri_data.get('turns', 5)
        rw_pri = pri_data.get('wire_radius_mm', 2.0)
        z_pri = pri_data.get('z_offset_mm', 0)
        
        # Calculations Secondary
        d_sec = r_sec * 2
        l_cable_sec = np.pi * n_sec * (d_sec + 2*rw_sec) / 1000.0 # meters
        A_sec = np.pi * (rw_sec/1000.0)**2
        R_sec = 1.7e-8 * l_cable_sec / A_sec if A_sec > 0 else 0
        
        # Wheeler inductance (metric)
        L_sec_uH = (r_sec**2 * n_sec**2) / (25.4 * (9*r_sec + 10*h_sec)) if (9*r_sec + 10*h_sec) > 0 else 0
        L_sec = L_sec_uH * 1e-6
        
        # Medhurst Capacitance
        if d_sec > 0:
            h_D = h_sec / d_sec
            C_sec_pF = (d_sec / 10.0) * (0.1126 * h_D + 0.08 + 0.27 / np.sqrt(h_D))
        else:
            C_sec_pF = 0
            
        C_total_pF = C_sec_pF + c_topload
        C_total = C_total_pF * 1e-12
        
        f_res = 1 / (2 * np.pi * np.sqrt(L_sec * C_total)) if L_sec * C_total > 0 else 0
        
        # Calculations Primary
        d_pri = r_pri * 2
        l_cable_pri = np.pi * n_pri * (d_pri + 2*rw_pri) / 1000.0
        A_pri = np.pi * (rw_pri/1000.0)**2
        R_pri = 1.7e-8 * l_cable_pri / A_pri if A_pri > 0 else 0
        L_pri_uH = (r_pri**2 * n_pri**2) / (25.4 * (9*r_pri + 10*h_pri)) if (9*r_pri + 10*h_pri) > 0 else 0
        L_pri = L_pri_uH * 1e-6
        
        # Build Magpylib Coils
        def make_spiral(r, h, n, z_offset=0):
            if n == 0: return []
            t = np.linspace(0, n * 2 * np.pi, int(n * 20))
            x = r * np.cos(t)
            y = r * np.sin(t)
            z = np.linspace(-h/2, h/2, len(t)) + z_offset
            return np.column_stack((x, y, z))
            
        sec_verts = make_spiral(r_sec, h_sec, n_sec, 0)
        pri_verts = make_spiral(r_pri, h_pri, n_pri, z_pri)
        
        col = magpy.Collection()
        sec_coil = None
        pri_coil = None
        
        if len(sec_verts) > 0:
            sec_coil = magpy.current.Polyline(current=1.0, vertices=sec_verts) # 1A test
            sec_coil.style.color = '#3498db'
            col.add(sec_coil)
            
        if len(pri_verts) > 0:
            pri_coil = magpy.current.Polyline(current=1.0, vertices=pri_verts) # 1A for M calculation
            pri_coil.style.color = '#e74c3c'
            pri_coil.style.line.width = 4
            col.add(pri_coil)
            
        # Mutual Inductance calculation numerically M = Flux / I
        # Evaluate B field from Primary at the center of each turn of Secondary
        M = 0
        k = 0
        if pri_coil and n_sec > 0:
            turn_zs = np.linspace(-h_sec/2, h_sec/2, int(n_sec))
            centers = np.column_stack((np.zeros(len(turn_zs)), np.zeros(len(turn_zs)), turn_zs))
            B_at_centers = pri_coil.getB(centers) # in mT
            B_z = B_at_centers[:, 2] / 1000.0 # Convert to Tesla
            flux_per_turn = B_z * (np.pi * (r_sec/1000.0)**2)
            M = np.sum(flux_per_turn) # I = 1A so M = Total Flux
            if L_sec > 0 and L_pri > 0:
                k = abs(M) / np.sqrt(L_sec * L_pri)

        plotly_html = None
        try:
            import plotly.graph_objects as go
            fig_plotly = magpy.show(col, return_fig=True, backend='plotly')
            fig_plotly.update_layout(
                scene=dict(aspectmode='data'),
                margin=dict(l=0, r=0, b=0, t=0),
                showlegend=False
            )
            plotly_html = fig_plotly.to_html(full_html=False, include_plotlyjs='cdn')
        except Exception as e:
            print("Plotly error:", e)

        return jsonify({
            'status': 'success',
            'secondary': {
                'R_dc': float(R_sec),
                'L_uH': float(L_sec_uH),
                'C_pF': float(C_sec_pF),
                'f_res_Hz': float(f_res)
            },
            'primary': {
                'R_dc': float(R_pri),
                'L_uH': float(L_pri_uH)
            },
            'coupling': {
                'M_uH': float(M * 1e6),
                'k': float(k)
            },
            'plotly_html': plotly_html
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
