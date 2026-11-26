import asyncio, sys, os
from playwright.async_api import async_playwright
SIZES={'malia':(1600,1000),'electric':(1600,1066),'ey':(1600,1000),'adam':(1600,1000),'mof':(1200,1340),'etc':(1600,1066),'nutrition':(1600,1000)}
async def main(names):
    async with async_playwright() as p:
        b=await p.chromium.connect_over_cdp("http://localhost:29229")
        for n in names:
            w,h=SIZES[n]
            ctx=await b.new_context(viewport={"width":w,"height":h},device_scale_factor=1.5)
            pg=await ctx.new_page()
            await pg.goto(f"http://localhost:8000/design/src/{n}.html",wait_until="networkidle")
            await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(800)
            await pg.screenshot(path=f"/home/ubuntu/chiara-site/assets/design/{n}.jpg",type="jpeg",quality=86)
            await ctx.close(); print("ok",n)
asyncio.run(main(sys.argv[1:]))
