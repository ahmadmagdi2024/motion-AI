/**
 * Master Template & Default Motion Film (Pure 1080x1920 Cinematic Canvas)
 * Perfect 9:16 Full-Frame Scaling.
 */

export const DEFAULT_MOTION_FILM = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <script type="module" src="/vendor/lottie-sync.js"></script>
  <title>Artek Perfumes Motion Film</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=Montserrat:wght@300;400;500;600;700&display=swap');

    :root{
      --gold:#d9b66d;
      --pale:#f5e3b8;
      --black:#050606;
      --panel:#111312;
      --line:rgba(217,182,109,.28);
    }

    *{box-sizing:border-box;margin:0;padding:0}
    html,body{
      width:100%;
      height:100%;
      overflow:hidden;
      background:#050606;
      color:white;
      font-family:Cairo,sans-serif;
      position:relative;
    }

    #film-stage{
      position:absolute;
      width:1080px;
      height:1920px;
      left:50%;
      top:50%;
      overflow:hidden;
      transform-origin:center center;
      background:#050606;
      isolation:isolate;
    }

    #film-stage.english{direction:ltr;font-family:Montserrat,sans-serif}

    .scene{
      position:absolute;inset:0;
      overflow:hidden;
      opacity:0;
      visibility:hidden;
      background:#070808;
    }

    .scene.visible{visibility:visible}

    .vignette{
      position:absolute;inset:0;z-index:30;pointer-events:none;
      background:
        linear-gradient(180deg,rgba(0,0,0,.22),transparent 25%,transparent 65%,rgba(0,0,0,.65)),
        radial-gradient(circle,transparent 38%,rgba(0,0,0,.5) 120%);
    }

    .grain{
      position:absolute;inset:-40%;z-index:31;pointer-events:none;opacity:.055;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }

    .logo{
      position:absolute;z-index:40;top:88px;left:65px;
      display:flex;align-items:center;gap:13px;
      direction:ltr;font:500 19px Montserrat;letter-spacing:.16em;
    }

    .logo i{
      width:42px;height:42px;border:2px solid var(--gold);
      border-radius:50%;display:grid;place-items:center;
      color:var(--gold);font:normal 21px Georgia;
    }

    .index{
      position:absolute;z-index:40;bottom:90px;left:65px;
      font:500 19px Montserrat;color:#777;direction:ltr;
    }

    .index b{color:var(--gold);font-size:29px}

    .copy{
      position:absolute;z-index:20;
      top:205px;left:72px;right:72px;
    }

    .kicker{
      display:flex;align-items:center;gap:17px;
      color:var(--pale);font-size:24px;letter-spacing:.04em;
    }

    .kicker::before{
      content:"";width:60px;height:2px;background:var(--gold);
    }

    h1{
      margin:28px 0 0;
      font-size:94px;line-height:1.26;
      font-weight:600;letter-spacing:-.035em;
    }

    .english h1{font-size:76px;line-height:1.14}
    .gold{color:var(--pale)}

    .description{
      width:80%;
      margin-top:28px;
      color:rgba(255,255,255,.7);
      font-size:28px;line-height:1.75;font-weight:300;
    }

    /* SCENE 1 — FACTORY */
    .factory-bg{
      position:absolute;inset:0;
      background:
        radial-gradient(circle at 74% 26%,rgba(224,183,98,.22),transparent 18%),
        linear-gradient(145deg,#222019,#090a09 48%,#161109);
    }

    .factory{
      position:absolute;left:80px;right:80px;bottom:210px;height:870px;
      perspective:900px;
    }

    .building{
      position:absolute;inset:120px 0 0;
      background:linear-gradient(115deg,#111311,#35342b 50%,#0b0c0b);
      border-top:5px solid rgba(217,182,109,.45);
      transform:skewY(-2deg);
      box-shadow:0 80px 90px rgba(0,0,0,.5);
    }

    .building::before{
      content:"ARTEK PERFUMES";
      position:absolute;top:60px;left:0;right:0;text-align:center;
      color:var(--pale);font:500 32px Montserrat;letter-spacing:.25em;
    }

    .door{
      position:absolute;bottom:0;left:50%;width:310px;height:520px;
      transform:translateX(-50%);
      background:
        linear-gradient(90deg,rgba(255,255,255,.04),rgba(217,182,109,.2),rgba(255,255,255,.04)),
        #0a0b0a;
      border:2px solid rgba(217,182,109,.3);
    }

    .door::after{
      content:"";position:absolute;left:50%;top:0;width:2px;height:100%;
      background:rgba(217,182,109,.2);
    }

    .person{
      position:absolute;z-index:7;bottom:80px;left:50%;
      width:110px;height:320px;transform:translateX(-50%);
    }

    .person .head{
      position:absolute;top:0;left:31px;width:49px;height:58px;
      border-radius:50%;background:#030404;
    }

    .person .body{
      position:absolute;top:52px;left:12px;width:86px;height:180px;
      border-radius:40px 40px 16px 16px;background:#030404;
    }

    .person .leg{
      position:absolute;top:215px;width:35px;height:115px;background:#030404;
    }

    .person .leg.a{left:17px;transform:rotate(4deg)}
    .person .leg.b{right:17px;transform:rotate(-4deg)}

    .gold-trail{
      position:absolute;z-index:12;left:-200px;top:980px;
      width:1400px;height:5px;
      background:linear-gradient(90deg,transparent,var(--gold),var(--pale),transparent);
      box-shadow:0 0 30px rgba(217,182,109,.9);
    }

    /* SCENE 2 — EXPERIENCE */
    .experience-bg{
      position:absolute;inset:0;
      background:
        linear-gradient(110deg,rgba(217,182,109,.2),transparent 35%),
        radial-gradient(circle at 25% 60%,#37332a,#0b0d0c 42%,#050606 75%);
    }

    .big-25{
      position:absolute;z-index:4;top:460px;right:-30px;
      color:transparent;
      -webkit-text-stroke:3px rgba(217,182,109,.3);
      font:700 410px/1 Montserrat;
      letter-spacing:-.1em;
    }

    .expert{
      position:absolute;z-index:8;bottom:160px;right:100px;
      width:410px;height:810px;
    }

    .expert .head{
      position:absolute;top:0;left:140px;width:130px;height:145px;
      border-radius:50%;background:linear-gradient(145deg,#191b19,#050606);
    }

    .expert .body{
      position:absolute;top:125px;left:30px;width:350px;height:600px;
      border-radius:150px 150px 35px 35px;
      background:linear-gradient(100deg,#050606,#242621 50%,#080909);
    }

    .expert .arm{
      position:absolute;top:370px;left:-80px;width:310px;height:70px;
      border-radius:40px;background:#0a0b0a;transform:rotate(-18deg);
    }

    .sample{
      position:absolute;z-index:9;bottom:490px;left:245px;
      width:90px;height:150px;
      border:2px solid var(--gold);border-radius:12px 12px 24px 24px;
      background:linear-gradient(transparent,rgba(217,182,109,.4));
      box-shadow:0 0 35px rgba(217,182,109,.25);
    }

    .metric{
      position:absolute;z-index:18;bottom:250px;left:75px;
      padding-left:26px;border-left:3px solid var(--gold);
      direction:ltr;text-align:left;
    }

    .metric strong{display:block;color:var(--pale);font:600 105px/1 Montserrat}
    .metric span{display:block;margin-top:12px;font-size:26px}

    /* SCENE 3 — FORMULA */
    .formula-bg{
      position:absolute;inset:0;
      background:
        radial-gradient(circle at 50% 49%,rgba(217,182,109,.3),transparent 14%),
        radial-gradient(circle at center,#4b361e,#11110e 31%,#050606 70%);
    }

    .drop{
      position:absolute;z-index:12;left:50%;top:390px;
      width:105px;height:105px;
      border-radius:70% 30% 68% 32%/70% 35% 65% 30%;
      background:linear-gradient(145deg,#fff0c8,#9d6c2a 70%);
      box-shadow:0 0 65px rgba(217,182,109,.55);
    }

    .liquid{
      position:absolute;z-index:7;left:50%;top:850px;
      width:720px;height:280px;
      transform:translateX(-50%);
      border-radius:50%;
      border:3px solid rgba(238,208,143,.45);
      background:radial-gradient(ellipse,rgba(217,182,109,.24),rgba(0,0,0,.25) 58%,transparent 70%);
    }

    .ripple{
      position:absolute;z-index:10;left:50%;top:930px;
      width:100px;height:100px;border-radius:50%;
      border:3px solid var(--pale);
    }

    .note-ring{
      position:absolute;z-index:14;left:50%;top:930px;
      width:650px;height:650px;border-radius:50%;
      border:1px solid rgba(217,182,109,.25);
    }

    .note-ring span{
      position:absolute;color:var(--pale);
      font:500 23px Montserrat;letter-spacing:.13em;
    }

    .note-ring span:nth-child(1){top:0;left:50%;transform:translateX(-50%)}
    .note-ring span:nth-child(2){right:-35px;top:48%}
    .note-ring span:nth-child(3){bottom:0;left:50%;transform:translateX(-50%)}
    .note-ring span:nth-child(4){left:-28px;top:48%}

    .formula-number{
      position:absolute;z-index:18;left:70px;right:70px;bottom:220px;text-align:center;
    }

    .formula-number strong{display:block;color:var(--pale);font:600 115px/1 Montserrat}
    .formula-number span{font-size:31px}

    /* SCENE 4 — DESIGN */
    .design-bg{
      position:absolute;inset:0;
      background:
        linear-gradient(135deg,rgba(217,182,109,.18),transparent 36%),
        radial-gradient(circle at 70% 65%,#342817,#0a0c0b 38%,#050606 75%);
    }

    .grid{
      position:absolute;inset:0;opacity:.17;
      background-image:
        linear-gradient(rgba(217,182,109,.25) 1px,transparent 1px),
        linear-gradient(90deg,rgba(217,182,109,.25) 1px,transparent 1px);
      background-size:70px 70px;
    }

    .bottle{
      position:absolute;z-index:10;left:50%;top:730px;
      width:390px;height:600px;
      border:4px solid var(--gold);
      border-radius:42px 42px 95px 95px;
      background:linear-gradient(145deg,rgba(255,255,255,.12),rgba(217,182,109,.06),rgba(0,0,0,.3));
      box-shadow:inset 0 0 90px rgba(217,182,109,.08),0 0 65px rgba(217,182,109,.11);
    }

    .bottle::before{
      content:"";position:absolute;left:50%;top:-145px;
      width:150px;height:140px;transform:translateX(-50%);
      border:4px solid var(--gold);border-bottom:0;border-radius:15px 15px 0 0;
      background:linear-gradient(#58401d,#0d0e0d);
    }

    .bottle::after{
      content:"ARTEK";position:absolute;inset:0;display:grid;place-items:center;
      color:var(--pale);font:500 35px Montserrat;letter-spacing:.25em;
    }

    .scanner{
      position:absolute;z-index:12;left:180px;right:180px;height:4px;top:740px;
      background:linear-gradient(90deg,transparent,var(--pale),transparent);
      box-shadow:0 0 35px var(--gold);
    }

    .tags{
      position:absolute;z-index:18;left:60px;right:60px;bottom:180px;
      display:flex;flex-wrap:wrap;justify-content:center;gap:12px;
    }

    .tag{
      padding:12px 22px;border-radius:999px;
      border:1px solid rgba(217,182,109,.42);
      background:rgba(5,6,6,.7);color:var(--pale);
      font-size:20px;
    }

    /* SCENE 5 — PRODUCTION */
    .production-bg{
      position:absolute;inset:0;
      background:linear-gradient(120deg,#111513,#302d23 45%,#080a09 72%);
    }

    .machine-lines{
      position:absolute;inset:0;opacity:.25;
      background:repeating-linear-gradient(90deg,transparent 0 145px,rgba(255,255,255,.08) 147px 149px);
    }

    .conveyor{
      position:absolute;z-index:7;left:-300px;right:-300px;bottom:420px;height:170px;
      background:linear-gradient(#22251f,#090a09);
      border-top:4px solid rgba(217,182,109,.4);
      border-bottom:18px solid #020303;
    }

    .conveyor::after{
      content:"";position:absolute;left:0;right:0;bottom:20px;height:45px;
      background:repeating-linear-gradient(90deg,#070808 0 75px,#25271f 76px 145px);
    }

    .mini-bottle{
      position:absolute;z-index:9;bottom:580px;width:145px;height:250px;
      border:2px solid rgba(238,213,159,.75);
      border-radius:17px 17px 34px 34px;
      background:linear-gradient(145deg,rgba(255,255,255,.14),rgba(217,182,109,.17),rgba(0,0,0,.3));
    }

    .mini-bottle::before{
      content:"";position:absolute;left:50%;top:-70px;width:64px;height:68px;
      transform:translateX(-50%);background:#342816;border:2px solid var(--gold);
    }

    .mini-bottle::after{
      content:"A";position:absolute;inset:0;display:grid;place-items:center;
      color:var(--gold);font:32px Georgia;
    }

    .quality{
      position:absolute;z-index:20;left:50%;bottom:245px;
      width:280px;height:280px;border-radius:50%;
      display:grid;place-items:center;text-align:center;
      border:3px solid var(--gold);background:rgba(5,6,6,.9);
      box-shadow:0 0 0 15px rgba(217,182,109,.07),0 0 60px rgba(0,0,0,.7);
    }

    .quality strong{display:block;color:var(--pale);font:600 54px Montserrat}
    .quality span{font-size:20px}

    /* SCENE 6 — FINALE */
    .final-bg{
      position:absolute;inset:0;
      background:
        radial-gradient(ellipse at 50% 74%,rgba(217,182,109,.38),transparent 28%),
        radial-gradient(circle at center,#2b281f,#0a0b0a 44%,#020303 80%);
    }

    .final-title{
      position:absolute;z-index:20;top:170px;left:60px;right:60px;text-align:center;
    }

    .final-title strong{
      color:var(--pale);font:500 46px Montserrat;letter-spacing:.18em;
    }

    .final-title h2{font-size:60px;line-height:1.42;font-weight:500;margin:25px 0}

    .products{
      position:absolute;z-index:12;left:50%;bottom:300px;
      width:760px;height:700px;
    }

    .product{
      position:absolute;bottom:0;width:230px;
      border:2px solid rgba(238,213,159,.75);
      border-radius:24px 24px 58px 58px;
      background:linear-gradient(145deg,rgba(255,255,255,.18),rgba(217,182,109,.13) 45%,rgba(0,0,0,.5));
      box-shadow:inset 0 0 60px rgba(255,255,255,.06),0 45px 50px rgba(0,0,0,.55);
    }

    .product::before{
      content:"";position:absolute;width:95px;height:90px;top:-92px;left:50%;
      transform:translateX(-50%);
      border:2px solid rgba(238,213,159,.75);
      background:linear-gradient(#8f6b2e,#211609);
    }

    .product::after{
      content:"ARTEK";position:absolute;inset:0;display:grid;place-items:center;
      color:var(--pale);font:500 20px Montserrat;letter-spacing:.17em;
    }

    .product:nth-child(1){left:35px;height:390px;transform:rotate(-5deg);opacity:.72}
    .product:nth-child(2){left:265px;height:510px;z-index:3}
    .product:nth-child(3){right:30px;height:410px;transform:rotate(5deg);opacity:.76}

    .contact{
      position:absolute;z-index:20;left:65px;right:65px;bottom:115px;
      display:flex;justify-content:space-between;
      padding-top:28px;border-top:1px solid rgba(217,182,109,.4);
      color:#ddd;font:500 21px Montserrat;direction:ltr;
    }

    .flash{
      position:absolute;z-index:50;inset:-20%;pointer-events:none;opacity:0;
      background:linear-gradient(110deg,transparent 28%,rgba(255,240,205,.92) 48%,transparent 68%);
      filter:blur(18px);
    }
  </style>
</head>

<body>
  <div id="film-stage">
    <div class="logo">
      <div><i>A</i><span>ARTEK PERFUMES</span></div>
    </div>

    <!-- Scene 1 -->
    <section class="scene visible" data-scene="0">
      <div class="factory-bg visual"></div>
      <div class="factory visual">
        <div class="building"></div>
        <div class="door visual"></div>
        <div class="person visual">
          <div class="head"></div>
          <div class="body"></div>
          <div class="leg a"></div>
          <div class="leg b"></div>
        </div>
      </div>
      <div class="gold-trail visual"></div>
      <div class="copy">
        <div class="kicker anim" data-ar="من قلب الإمارات" data-en="From the United Arab Emirates">من قلب الإمارات</div>
        <h1 class="anim">
          <span data-ar="تبدأ صناعة" data-en="Every fragrance">تبدأ صناعة</span><br>
          <span class="gold" data-ar="العطر من فكرة" data-en="begins with an idea">العطر من فكرة</span>
        </h1>
        <p class="description anim"
           data-ar="نحوّل الرؤية إلى تجربة عطرية تحمل هوية وحضورًا لا يُنسى."
           data-en="We transform creative vision into a distinctive fragrance experience.">
          نحوّل الرؤية إلى تجربة عطرية تحمل هوية وحضورًا لا يُنسى.
        </p>
      </div>
      <div class="index"><b>01</b> / 06</div>
    </section>

    <!-- Scene 2 -->
    <section class="scene" data-scene="1">
      <div class="experience-bg visual"></div>
      <div class="big-25 visual">25</div>
      <div class="expert visual">
        <div class="head"></div>
        <div class="body"></div>
        <div class="arm"></div>
      </div>
      <div class="sample visual"></div>
      <div class="copy">
        <div class="kicker anim" data-ar="إرث من الخبرة" data-en="A legacy of expertise">إرث من الخبرة</div>
        <h1 class="anim">
          <span data-ar="خبرة تصنع" data-en="Experience that">خبرة تصنع</span><br>
          <span class="gold" data-ar="الثقة والجودة" data-en="inspires confidence">الثقة والجودة</span>
        </h1>
      </div>
      <div class="metric anim">
        <strong>25+</strong>
        <span data-ar="عامًا من الخبرة" data-en="Years of expertise">عامًا من الخبرة</span>
      </div>
      <div class="index"><b>02</b> / 06</div>
    </section>

    <!-- Scene 3 -->
    <section class="scene" data-scene="2">
      <div class="formula-bg visual"></div>
      <div class="drop visual"></div>
      <div class="liquid visual"></div>
      <div class="ripple visual"></div>
      <canvas id="lottie-sparkle" class="visual" width="400" height="400" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:15;opacity:0.85;"></canvas>
      <div class="note-ring visual">
        <span>OUD</span><span>AMBER</span><span>MUSK</span><span>ROSE</span>
      </div>
      <div class="copy">
        <div class="kicker anim" data-ar="ابتكار بلا حدود" data-en="Limitless creation">ابتكار بلا حدود</div>
      </div>
      <div class="formula-number anim">
        <strong id="counter">0+</strong>
        <span data-ar="تركيبة عطرية مبتكرة" data-en="Crafted fragrance formulas">تركيبة عطرية مبتكرة</span>
      </div>
      <div class="index"><b>03</b> / 06</div>
    </section>

    <!-- Scene 4 -->
    <section class="scene" data-scene="3">
      <div class="design-bg visual"></div>
      <div class="grid visual"></div>
      <div class="copy">
        <div class="kicker anim" data-ar="كل التفاصيل تحت سقف واحد" data-en="Every detail under one roof">كل التفاصيل تحت سقف واحد</div>
        <h1 class="anim">
          <span data-ar="من التصميم" data-en="From design">من التصميم</span><br>
          <span class="gold" data-ar="إلى المنتج النهائي" data-en="to final product">إلى المنتج النهائي</span>
        </h1>
      </div>
      <div class="bottle visual"></div>
      <div class="scanner visual"></div>
      <div class="tags">
        <span class="tag anim" data-ar="تصميم العبوة" data-en="Bottle Design">تصميم العبوة</span>
        <span class="tag anim" data-ar="الطباعة" data-en="Printing">الطباعة</span>
        <span class="tag anim" data-ar="النقش" data-en="Engraving">النقش</span>
        <span class="tag anim" data-ar="التذهيب" data-en="Gold Plating">التذهيب</span>
        <span class="tag anim" data-ar="التغليف" data-en="Packaging">التغليف</span>
      </div>
      <div class="index"><b>04</b> / 06</div>
    </section>

    <!-- Scene 5 -->
    <section class="scene" data-scene="4">
      <div class="production-bg visual"></div>
      <div class="machine-lines visual"></div>
      <div class="copy">
        <div class="kicker anim" data-ar="دقة في كل مرحلة" data-en="Precision at every stage">دقة في كل مرحلة</div>
        <h1 class="anim">
          <span data-ar="إنتاج متكامل" data-en="Integrated production">إنتاج متكامل</span><br>
          <span class="gold" data-ar="بجودة عالمية" data-en="Global quality">بجودة عالمية</span>
        </h1>
      </div>
      <div class="conveyor visual"></div>
      <div class="mini-bottle visual"></div>
      <div class="mini-bottle visual"></div>
      <div class="mini-bottle visual"></div>
      <div class="mini-bottle visual"></div>
      <div class="quality anim">
        <div>
          <strong>100%</strong>
          <span data-ar="معايير جودة عالمية" data-en="Global Quality Standards">معايير جودة عالمية</span>
        </div>
      </div>
      <div class="index"><b>05</b> / 06</div>
    </section>

    <!-- Scene 6 -->
    <section class="scene" data-scene="5">
      <div class="final-bg visual"></div>
      <div class="final-title">
        <strong class="anim">ARTEK PERFUMES</strong>
        <h2 class="anim"
            data-ar="من أول قطرة…<br>إلى آخر تفصيلة"
            data-en="From the first drop…<br>to the final detail">
          من أول قطرة…<br>إلى آخر تفصيلة
        </h2>
      </div>
      <div class="products visual">
        <div class="product"></div>
        <div class="product"></div>
        <div class="product"></div>
      </div>
      <div class="contact anim">
        <span>artekperfumes.com</span>
        <span data-ar="خبرة تصنع الحضور" data-en="Expertise creates distinction">خبرة تصنع الحضور</span>
      </div>
      <div class="index"><b>06</b> / 06</div>
    </section>

    <div class="vignette"></div>
    <div class="grain"></div>
    <div class="flash" id="flash"></div>
  </div>

  <script>
    (() => {
      const scenes = [
        {start:0,end:6},
        {start:6,end:14},
        {start:14,end:24},
        {start:24,end:37},
        {start:37,end:49},
        {start:49,end:60}
      ];

      const stage = document.getElementById("film-stage");
      const sceneElements = [...document.querySelectorAll(".scene")];
      const flash = document.getElementById("flash");

      let time = 0;
      let playing = false;
      let origin = 0;
      let originTime = 0;
      let frame;
      let language = "ar";

      const clamp = (v,a=0,b=1) => Math.max(a,Math.min(b,v));
      const ease = p => 1-Math.pow(1-clamp(p),3);
      const mix = (a,b,p) => a+(b-a)*p;

      function resize(){
        if(!stage) return;
        const scale = Math.min(window.innerWidth / 1080, window.innerHeight / 1920);
        stage.style.transform = \`translate(-50%, -50%) scale(\${scale})\`;
      }


      let syncSparkle = null;
      if (typeof window !== "undefined") {
        import("/vendor/lottie-sync.js").then(mod => {
          mod.createLottieTrack({
            canvas: "#lottie-sparkle",
            src: "/lottie/luxury-sparkle.json",
            startSec: 14,
            durationSec: 8,
            loop: true
          }).then(fn => { syncSparkle = fn; });
        }).catch(() => {});
      }

      function indexAt(t){
        return scenes.findIndex((s,i)=>t>=s.start&&(t<s.end||i===scenes.length-1));
      }

      function transform(el,opacity,x,y,scale=1,rotate=0){
        if(!el)return;
        el.style.opacity=opacity;
        el.style.transform=\`translate(\${x}px,\${y}px) scale(\${scale}) rotate(\${rotate}deg)\`;
      }

      function reveal(elements,local,start=0,end=1,stagger=.12,exitAt=999){
        elements.forEach((el,i)=>{
          const p=ease((local-start-i*stagger)/(end-start));
          const out=ease((local-exitAt)/.7);
          transform(el,p*(1-out),0,mix(75,0,p),mix(.96,1,p));
        });
      }

      function renderAtTime(value){
        time=clamp(Number(value)||0,0,60);
        const active=Math.max(0,indexAt(Math.min(time,59.999)));

        sceneElements.forEach((scene,i)=>{
          const s=scenes[i];
          if(!s) return;
          const transition=.75;
          const enter=i===0?1:clamp((time-(s.start-transition))/transition);
          const leave=i===scenes.length-1?1:1-clamp((time-(s.end-transition))/transition);
          const opacity=enter*leave;
          scene.style.opacity=opacity;
          scene.classList.toggle("visible",opacity>.001);
          scene.style.zIndex=i===active?5:3;
        });

        // Scene 1
        let l=time;
        reveal(sceneElements[0].querySelectorAll(".anim"),l,.2,1.25,.22,4.9);
        const factory=sceneElements[0].querySelector(".factory");
        if(factory) {
          factory.style.transform=\`translateY(\${mix(150,0,ease(l/1.7))}px) scale(\${1+l*.009})\`;
          factory.style.opacity=clamp(l/1.1);
        }
        const door=sceneElements[0].querySelector(".door");
        if(door) door.style.clipPath=\`inset(0 \${mix(50,0,ease((l-1)/2))}% 0 \${mix(50,0,ease((l-1)/2))}%\`;
        const person=sceneElements[0].querySelector(".person");
        if(person) {
          const walk=ease((l-1.1)/3.5);
          person.style.transform=\`translateX(-50%) translateY(\${mix(300,0,walk)}px) scale(\${mix(.55,1,walk)})\`;
          person.style.opacity=walk;
        }
        const trail=sceneElements[0].querySelector(".gold-trail");
        if(trail) trail.style.transform=\`translateX(\${mix(-900,900,clamp((l-3.7)/1.7))}px) rotate(-8deg)\`;

        // Scene 2
        l=time-6;
        reveal(sceneElements[1].querySelectorAll(".anim"),l,.15,1.2,.22,6.7);
        const expert=sceneElements[1].querySelector(".expert");
        if(expert) {
          const expertP=ease(l/1.8);
          expert.style.transform=\`translateX(\${mix(300,0,expertP)}px)\`;
          expert.style.opacity=expertP;
        }
        const sample=sceneElements[1].querySelector(".sample");
        if(sample) {
          sample.style.transform=\`translateY(\${Math.sin(Math.max(0,l)*2.2)*15}px) rotate(\${Math.sin(Math.max(0,l)*1.3)*4}deg)\`;
          sample.style.opacity=clamp((l-.7)/1);
        }
        const big25=sceneElements[1].querySelector(".big-25");
        if(big25) {
          big25.style.transform=\`translateX(\${mix(160,0,ease(l/1.7))}px) scale(\${1+l*.012})\`;
          big25.style.opacity=clamp(l/1.2);
        }

        // Scene 3
        l=time-14;
        if (syncSparkle) { try { syncSparkle(time); } catch(e) {} }
        reveal(sceneElements[2].querySelectorAll(".anim"),l,.15,1.1,.15,8.7);
        const drop=sceneElements[2].querySelector(".drop");
        if(drop) {
          const fall=ease(l/2.2);
          drop.style.transform=\`translate(-50%,\${mix(-330,430,fall)}px) rotate(45deg) scale(\${mix(.6,1,fall)})\`;
          drop.style.opacity=clamp(l/.5)*(1-clamp((l-2.4)/.5));
        }
        const ripple=sceneElements[2].querySelector(".ripple");
        if(ripple) {
          const rippleP=ease((l-2)/2.5);
          ripple.style.transform=\`translate(-50%,-50%) scale(\${mix(.2,8,rippleP)})\`;
          ripple.style.opacity=rippleP*(1-clamp((l-5.3)/2));
        }
        const ring=sceneElements[2].querySelector(".note-ring");
        if(ring) {
          const ringP=ease((l-2)/2);
          ring.style.transform=\`translate(-50%,-50%) scale(\${mix(.25,1,ringP)}) rotate(\${mix(-30,20,clamp(l/10))}deg)\`;
          ring.style.opacity=ringP*(1-clamp((l-8.4)/1));
        }
        const countP=ease((l-2.3)/3);
        const counterEl=document.getElementById("counter");
        if(counterEl) counterEl.textContent=Math.round(5000*countP).toLocaleString("en-US")+"+";

        // Scene 4
        l=time-24;
        reveal(sceneElements[3].querySelectorAll(".anim"),l,.15,1.1,.16,11.7);
        const bottle=sceneElements[3].querySelector(".bottle");
        if(bottle) {
          const bottleP=ease((l-.7)/2.2);
          bottle.style.transform=\`translate(-50%,-50%) scale(\${mix(.25,1,bottleP)}) rotateY(\${mix(55,0,bottleP)}deg)\`;
          bottle.style.opacity=bottleP;
        }
        const scanner=sceneElements[3].querySelector(".scanner");
        if(scanner) {
          scanner.style.transform=\`translateY(\${(Math.sin(Math.max(0,l-2)*1.4)+1)*280}px)\`;
          scanner.style.opacity=clamp((l-1.8)/.7)*(1-clamp((l-11)/1));
        }
        const grid=sceneElements[3].querySelector(".grid");
        if(grid) grid.style.transform=\`perspective(800px) rotateX(58deg) translateY(\${l*12}px) scale(1.4)\`;

        // Scene 5
        l=time-37;
        reveal(sceneElements[4].querySelectorAll(".anim"),l,.15,1.1,.18,10.6);
        const productionBottles=[...sceneElements[4].querySelectorAll(".mini-bottle")];
        productionBottles.forEach((b,i)=>{
          const cycle=((Math.max(0,l)*170+i*340)%1550)-220;
          b.style.left=cycle+"px";
          b.style.opacity=clamp((cycle+180)/100)*(1-clamp((cycle-1200)/160));
        });
        const conveyor=sceneElements[4].querySelector(".conveyor");
        if(conveyor) conveyor.style.backgroundPosition=\`\${l*160}px 0\`;
        const quality=sceneElements[4].querySelector(".quality");
        if(quality) {
          const qualityP=ease((l-3)/1.4);
          quality.style.transform=\`translate(-50%,0) scale(\${mix(.25,1,qualityP)}) rotate(\${mix(-40,0,qualityP)}deg)\`;
          quality.style.opacity=qualityP*(1-clamp((l-10.2)/1));
        }

        // Scene 6
        l=time-49;
        reveal(sceneElements[5].querySelectorAll(".anim"),l,.15,1.3,.23,99);
        const products=sceneElements[5].querySelector(".products");
        if(products) {
          const productP=ease((l-.6)/2.2);
          products.style.transform=\`translate(-50%,\${mix(260,0,productP)}px) scale(\${mix(.72,1,productP)})\`;
          products.style.opacity=productP;
        }
        [...sceneElements[5].querySelectorAll(".product")].forEach((p,i)=>{
          p.style.marginBottom=\`\${Math.sin(Math.max(0,l)*1.4+i)*9}px\`;
        });

        // Transition flash
        const boundaries=[6,14,24,37,49];
        const distance=Math.min(...boundaries.map(b=>Math.abs(time-b)));
        if(flash && distance<.48){
          const p=1-distance/.48;
          flash.style.opacity=p*.72;
          flash.style.transform=\`translateX(\${mix(-55,55,clamp((time-boundaries.reduce((a,b)=>Math.abs(b-time)<Math.abs(a-time)?b:a))/0.48+.5))}%\`;
        } else if(flash) {
          flash.style.opacity=0;
        }

        return time;
      }

      function tick(now){
        if(!playing)return;
        const next=originTime+(now-origin)/1000;
        if(next>=60){
          renderAtTime(60);
          stop();
          return;
        }
        renderAtTime(next);
        frame=requestAnimationFrame(tick);
      }

      function play(){
        if(time>=60)renderAtTime(0);
        playing=true;
        origin=performance.now();
        originTime=time;
        frame=requestAnimationFrame(tick);
      }

      function stop(){
        playing=false;
        cancelAnimationFrame(frame);
      }

      function toggle(){playing?stop():play()}

      function setLanguage(lang){
        language=lang;
        stage.classList.toggle("english",language==="en");
        stage.dir=language==="ar"?"rtl":"ltr";
        document.querySelectorAll("[data-ar]").forEach(el=>{
          const val=el.dataset[language];
          if(val){
            if(val.includes("<br>")) el.innerHTML=val;
            else el.textContent=val;
          }
        });
      }

      window.addEventListener("resize", resize);
      resize();
      renderAtTime(0);

      window.renderAtTime = renderAtTime;
      window.__studioAPI = {
        play,
        stop,
        toggle,
        renderAtTime,
        getTime: () => time,
        isPlaying: () => playing,
        setLanguage
      };

      setTimeout(()=>play(),300);
    })();
  </script>
</body>
</html>`;
