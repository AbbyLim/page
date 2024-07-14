const TWO_PI = Math.PI * 2;
const HALF_PI = Math.PI * 0.5;

// canvas settings
var viewWidth = window.innerWidth,
    viewHeight = window.innerHeight,
    drawingCanvas = document.getElementById("confetti"),
    ctx,
    timeStep = (1/60);

// 이미지 객체 생성
var coinImages = [];
var imageSources = [
    "../resources/images/coin1.png",
    "../resources/images/coin2.png",
    "../resources/images/coin3.png",
    "../resources/images/coin4.png",
    "../resources/images/coin5.png"
];

// 이미지 로드
imageSources.forEach(function(src) {
    var img = new Image();
    img.src = src;
    coinImages.push(img);
});

Point = function(x, y) {
    this.x = x || 0;
    this.y = y || 0;
};

Particle = function(p0, p1, p2, p3, image) {
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;

    this.time = 0;
    this.duration = 3 + Math.random() * 2;
    this.image = image;

	this.originalWidth = image.width;  // 이미지의 원래 너비
    this.originalHeight = image.height;  // 이미지의 원래 높이
    this.w = this.originalWidth;  // 초기 너비는 원래 너비로 설정
    this.h = this.originalHeight;  // 초기 높이는 원래 높이로 설정

    this.complete = false;
};

Particle.prototype = {
    update:function() {
        this.time = Math.min(this.duration, this.time + timeStep);

        var f = Ease.outCubic(this.time, 0, 1, this.duration);
        var p = cubeBezier(this.p0, this.p1, this.p2, this.p3, f);

        var dx = p.x - this.x;
        var dy = p.y - this.y;

        this.r =  Math.atan2(dy, dx) + HALF_PI;
        this.sy = Math.sin(Math.PI * f * 10);
        this.x = p.x;
        this.y = p.y;

        this.complete = this.time === this.duration;
    },
    draw:function() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.r);
        ctx.scale(1, this.sy);

        // 이미지 그리기
        ctx.drawImage(this.image, -this.w * 0.5, -this.h * 0.5, this.w, this.h);
		
        // 화면 너비가 720px 이상일 때 원래 이미지 크기로 그리기
        if (viewWidth >= 720) {
            ctx.drawImage(this.image, -this.originalWidth * 0.5, -this.originalHeight * 0.5, this.originalWidth, this.originalHeight);
        } else {
            // 그 외에는 화면 크기의 비율에 맞춰서 크기 조정
			this.w = viewWidth * 0.04; 
			this.h = viewWidth * 0.04;
            ctx.drawImage(this.image, -this.w * 0.5, -this.h * 0.5, this.w, this.h);
        }

        ctx.restore();
    }
};

Loader = function(x, y) {
    this.x = x;
    this.y = y;

    this.r = viewWidth * 0.05;  // 반지름을 화면 너비의 5%로 설정
    this._progress = 0;

    this.complete = false;
};

Loader.prototype = {
    reset:function() {
        this._progress = 0;
        this.complete = false;
    },
    set progress(p) {
        this._progress = p < 0 ? 0 : (p > 1 ? 1 : p);

        this.complete = this._progress === 1;
    },
    get progress() {
        return this._progress;
    },
    draw:function() {
        ctx.fillStyle = 'transparent';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, -HALF_PI, TWO_PI * this._progress - HALF_PI);
        ctx.lineTo(this.x, this.y);
        ctx.closePath();
        ctx.fill();
    }
};

// pun intended
Exploader = function(x, y) {
    this.x = x;
    this.y = y;

    this.startRadius = viewWidth * 0.05;  // 반지름을 화면 너비의 5%로 설정

    this.time = 0;
    this.duration = 0.4;
    this.progress = 0;

    this.complete = false;
};

Exploader.prototype = {
    reset:function() {
        this.time = 0;
        this.progress = 0;
        this.complete = false;
    },
    update:function() {
        this.time = Math.min(this.duration, this.time + timeStep);
        this.progress = Ease.inBack(this.time, 0, 1, this.duration);

        this.complete = this.time === this.duration;
    },
    draw:function() {
        ctx.fillStyle = 'transparent';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.startRadius * (1 - this.progress), 0, TWO_PI);
        ctx.fill();
    }
};

var particles = [],
    loader,
    exploader,
    phase = 0;

function initDrawingCanvas() {
    viewWidth = window.innerWidth;
    viewHeight = window.innerHeight;
    drawingCanvas.width = viewWidth;
    drawingCanvas.height = viewHeight;
    ctx = drawingCanvas.getContext('2d');

    createLoader();
    createExploader();
    createParticles();
}

function createLoader() {
    loader = new Loader(viewWidth * 0.5, viewHeight * 0.5);
}

function createExploader() {
    exploader = new Exploader(viewWidth * 0.5, viewHeight * 0.5);
}

function createParticles() {
    particles = [];
    var totalImages = coinImages.length;
    var minCountPerImage = 2;
    var maxParticles = 64;

    // 각 이미지가 최소 2개 이상 포함되도록 particles 생성
    for (var i = 0; i < totalImages; i++) {
        for (var j = 0; j < minCountPerImage; j++) {
            var p0 = new Point(viewWidth * 0.5, viewHeight * 0.5);
            var p1 = new Point(Math.random() * viewWidth, Math.random() * viewHeight);
            var p2 = new Point(Math.random() * viewWidth, Math.random() * viewHeight);
            var p3 = new Point(Math.random() * viewWidth, viewHeight + 64);

            particles.push(new Particle(p0, p1, p2, p3, coinImages[i]));
        }
    }

    // 나머지 particles 생성
    for (var i = particles.length; i < maxParticles; i++) {
        var p0 = new Point(viewWidth * 0.5, viewHeight * 0.5);
        var p1 = new Point(Math.random() * viewWidth, Math.random() * viewHeight);
        var p2 = new Point(Math.random() * viewWidth, Math.random() * viewHeight);
        var p3 = new Point(Math.random() * viewWidth, viewHeight + 64);

        // 랜덤 이미지 선택
        var image = coinImages[Math.floor(Math.random() * coinImages.length)];
        particles.push(new Particle(p0, p1, p2, p3, image));
    }
}

function update() {
    switch (phase) {
        case 0:
            loader.progress += (1/45);
            break;
        case 1:
            exploader.update();
            break;
        case 2:
            particles.forEach(function(p) {
                p.update();
            });
            break;
    }
}

function draw() {
    ctx.clearRect(0, 0, viewWidth, viewHeight);

    switch (phase) {
        case 0:
            loader.draw();
            break;
        case 1:
            exploader.draw();
            break;
        case 2:
            particles.forEach(function(p) {
                p.draw();
            });
        break;
    }
}

window.onload = function() {
    initDrawingCanvas();
    requestAnimationFrame(loop);
};

window.onresize = function() {
    initDrawingCanvas();
};

function loop() {
    update();
    draw();

    if (phase === 0 && loader.complete) {
        phase = 1;
    }
    else if (phase === 1 && exploader.complete) {
        phase = 2;
    }
    else if (phase === 2 && checkParticlesComplete()) {
        // reset
        phase = 0;
        loader.reset();
        exploader.reset();
        createParticles();
    }

    requestAnimationFrame(loop);
}

function checkParticlesComplete() {
    for (var i = 0; i < particles.length; i++) {
        if (particles[i].complete === false) return false;
    }
    return true;
}

// math and stuff

/**
 * easing equations from http://gizma.com/easing/
 * t = current time
 * b = start value
 * c = delta value
 * d = duration
 */
var Ease = {
    inCubic:function (t, b, c, d) {
        t /= d;
        return c*t*t*t + b;
    },
    outCubic:function(t, b, c, d) {
        t /= d;
        t--;
        return c*(t*t*t + 1) + b;
    },
    inOutCubic:function(t, b, c, d) {
        t /= d/2;
        if (t < 1) return c/2*t*t*t + b;
        t -= 2;
        return c/2*(t*t*t + 2) + b;
    },
    inBack: function (t, b, c, d, s) {
        s = s || 1.70158;
        return c*(t/=d)*t*((s+1)*t - s) + b;
    }
};

function cubeBezier(p0, c0, c1, p1, t) {
    var p = new Point();
    var nt = (1 - t);

    p.x = nt * nt * nt * p0.x + 3 * nt * nt * t * c0.x + 3 * nt * t * t * c1.x + t * t * t * p1.x;
    p.y = nt * nt * nt * p0.y + 3 * nt * nt * t * c0.y + 3 * nt * t * t * c1.y + t * t * t * p1.y;
    return p;
}