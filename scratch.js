function actualizarEsquemaMarx(etapas, C_nf, R_mohm) {
    const stageHeight = 60;
    const width = 160;
    const totalHeight = etapas * stageHeight + 40;
    
    let svgHTML = `
        <svg viewBox="0 0 ${width} ${totalHeight}" style="width: 100%; max-width: 250px; height: auto;">
            <defs>
                <marker id="arrowhead-marx" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                </marker>
            </defs>
    `;
    
    const startY = totalHeight - 20;
    
    // Bottom Source
    svgHTML += `
        <text x="${width/2}" y="${startY + 15}" font-family="sans-serif" font-size="10" font-weight="bold" fill="#334155" text-anchor="middle">HV DC</text>
        <line x1="30" y1="${startY}" x2="130" y2="${startY}" stroke="#334155" stroke-width="2"/>
    `;
    
    // Draw stages
    for (let i = 0; i < etapas; i++) {
        let yBottom = startY - i * stageHeight;
        let yTop = yBottom - stageHeight;
        
        // Left resistor
        svgHTML += `
            <line x1="30" y1="${yBottom}" x2="30" y2="${yBottom - 10}" stroke="#334155" stroke-width="2"/>
            <polyline points="30,${yBottom - 10} 25,${yBottom - 15} 35,${yBottom - 25} 25,${yBottom - 35} 35,${yBottom - 45} 30,${yBottom - 50}" fill="none" stroke="#334155" stroke-width="2"/>
            <line x1="30" y1="${yBottom - 50}" x2="30" y2="${yTop}" stroke="#334155" stroke-width="2"/>
        `;
        
        // Right resistor
        svgHTML += `
            <line x1="130" y1="${yBottom}" x2="130" y2="${yBottom - 10}" stroke="#334155" stroke-width="2"/>
            <polyline points="130,${yBottom - 10} 125,${yBottom - 15} 135,${yBottom - 25} 125,${yBottom - 35} 135,${yBottom - 45} 130,${yBottom - 50}" fill="none" stroke="#334155" stroke-width="2"/>
            <line x1="130" y1="${yBottom - 50}" x2="130" y2="${yTop}" stroke="#334155" stroke-width="2"/>
        `;
        
        // Capacitor (horizontal)
        svgHTML += `
            <line x1="30" y1="${yTop}" x2="75" y2="${yTop}" stroke="#334155" stroke-width="2"/>
            <line x1="75" y1="${yTop - 10}" x2="75" y2="${yTop + 10}" stroke="#334155" stroke-width="2"/>
            <line x1="85" y1="${yTop - 10}" x2="85" y2="${yTop + 10}" stroke="#334155" stroke-width="2"/>
            <line x1="85" y1="${yTop}" x2="130" y2="${yTop}" stroke="#334155" stroke-width="2"/>
        `;
        
        // Spark gap (diagonal from right yBottom to left yTop - using user reference logic)
        svgHTML += `
            <line x1="130" y1="${yBottom}" x2="40" y2="${yTop+5}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4" marker-end="url(#arrowhead-marx)"/>
        `;
        
        // Nodes
        svgHTML += `
            <circle cx="30" cy="${yTop}" r="3" fill="#334155"/>
            <circle cx="130" cy="${yTop}" r="3" fill="#334155"/>
        `;
        
        // Labels for first stage only
        if (i === 0) {
            svgHTML += `
                <text x="10" y="${yBottom - 25}" font-family="sans-serif" font-size="10" fill="#334155" transform="rotate(-90 10,${yBottom - 25})">${R_mohm} MΩ</text>
                <text x="150" y="${yBottom - 25}" font-family="sans-serif" font-size="10" fill="#334155" transform="rotate(-90 150,${yBottom - 25})">${R_mohm} MΩ</text>
                <text x="80" y="${yTop - 15}" font-family="sans-serif" font-size="10" font-weight="bold" fill="#334155" text-anchor="middle">${C_nf} nF</text>
            `;
        }
    }
    
    // Top Output Terminals
    const yTopmost = startY - etapas * stageHeight;
    svgHTML += `
        <line x1="30" y1="${yTopmost}" x2="30" y2="${yTopmost - 10}" stroke="#334155" stroke-width="2"/>
        <line x1="130" y1="${yTopmost}" x2="130" y2="${yTopmost - 10}" stroke="#334155" stroke-width="2"/>
        <circle cx="30" cy="${yTopmost - 10}" r="4" fill="#ffffff" stroke="#ef4444" stroke-width="2"/>
        <circle cx="130" cy="${yTopmost - 10}" r="4" fill="#ffffff" stroke="#ef4444" stroke-width="2"/>
        <text x="80" y="${yTopmost - 5}" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ef4444" text-anchor="middle">⚡ V_out</text>
    `;
    
    svgHTML += `</svg>`;
    console.log("SVG Generado correctamente.");
}
try {
    actualizarEsquemaMarx(5, 2, 1);
} catch(e) {
    console.error(e);
}
