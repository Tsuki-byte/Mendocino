import magpylib as magpy
poly = magpy.current.Polyline(
    current=1,
    vertices=[(0,0,0), (1,1,1)],
    position=(0,0,0)
)
print(dir(poly.style.line))
