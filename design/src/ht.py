from PIL import Image, ImageDraw, ImageOps, ImageFilter
def halftone(src, out, color, cell=9, scale=3, contrast=1.6, width=None, angle=15, gamma=0.9):
    im=Image.open(src).convert('L')
    if width: im=im.resize((width,int(im.height*width/im.width)),Image.LANCZOS)
    im=ImageOps.autocontrast(im,cutoff=2)
    im=im.point(lambda v: max(0,min(255,int((v-128)*contrast+128))))
    big=im.rotate(angle,expand=True,fillcolor=255); W,H=big.size
    canvas=Image.new('L',(W*scale,H*scale),0); d=ImageDraw.Draw(canvas)
    px=big.load()
    for y in range(0,H,cell):
        for x in range(0,W,cell):
            v=sum(px[min(W-1,x+i),min(H-1,y+j)] for i in range(cell) for j in range(cell))/(cell*cell)
            r=(1-v/255)**gamma*cell*0.7*scale
            if r>0.6:
                cx,cy=(x+cell/2)*scale,(y+cell/2)*scale; d.ellipse((cx-r,cy-r,cx+r,cy+r),fill=255)
    canvas=canvas.rotate(-angle,fillcolor=0); cw,ch=im.width*scale,im.height*scale
    l=(canvas.width-cw)//2;t=(canvas.height-ch)//2
    mask=canvas.crop((l,t,l+cw,t+ch)).filter(ImageFilter.GaussianBlur(0.6)).resize((cw//2,ch//2),Image.LANCZOS)
    o=Image.new('RGBA',mask.size,color+(0,)); o.putalpha(mask); o.save(out)
if __name__=='__main__':
    halftone('../../assets/podium.jpg','ht/podium-blue.png',(24,52,230),cell=5,width=400,scale=4,contrast=1.15,gamma=1.3)
    halftone('../../assets/podium.jpg','ht/podium-pink.png',(255,72,140),cell=6,width=400,scale=4,angle=45,contrast=1.0,gamma=1.8)
