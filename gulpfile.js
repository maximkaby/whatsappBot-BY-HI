var gulp = require("gulp");
var sass = require("gulp-sass");
var sourcemaps = require("gulp-sourcemaps");
var autoprefixer = require("gulp-autoprefixer");
var concat = require("gulp-concat");
var cleanCss = require("gulp-clean-css");
var gulpIf = require("gulp-if");
var browserSync = require("browser-sync").create();


var config = {
    paths:{
        scss:'./app/scss/**/*.scss',
        html:'./app/index.html'
    },
    output:{
        cssName:'bundle.min.css',
        path:'./app/'
    },
    isDeveloper:true
};

gulp.task("serve", function () {
    browserSync.init({
        server:{
            baseDir:config.output.path
        }
    });
    gulp.watch(config.paths.scss,["scss"]);
    gulp.watch(config.paths.html).on("change",browserSync.reload);
});


gulp.task("scss",function () {
    return gulp.src(config.paths.scss)
        .pipe(gulpIf(config.isDeveloper, sourcemaps.init()))
        .pipe(sass())
        .pipe(concat(config.output.cssName))
        .pipe(autoprefixer())
        .pipe(gulpIf(config.isDeveloper,sourcemaps.write()))
        /*.pipe(gulpIf(config.isDeveloper,cleanCss()))*/
        .pipe(gulp.dest(config.output.path))
        .pipe(browserSync.stream())

});

gulp.task('scripts', function() {
    return gulp.src([
        'node_modules/jquery/dist/jquery.js'
        // 'node_modules/swiper/dist/js/swiper.js',
        // 'node_modules/popper.js/dist/umd/popper.js',
        //'node_modules/bootstrap/dist/js/bootstrap.min.js',
        //'node_modules/materialize-css/dist/js/materialize.js'
    ])
        .pipe(concat('libs.min.js'))
        // .pipe(uglify())
        .pipe(gulp.dest('app/js'));
});

gulp.task('libs-css', function() {
    return gulp.src([
        //'node_modules/swiper/dist/css/swiper.css',
        'node_modules/bootstrap/dist/css/bootstrap.css',
        //'public/css/materialize.css',
        'node_modules/font-awesome/css/font-awesome.min.css',
    ])
        .pipe(concat('libs.min.css'))
        .pipe(gulp.dest('app/css'));
});



gulp.task('img', function() {
    return gulp.src('public/img/**/*')
        .pipe(imagemin())
        .pipe(gulp.dest('public/cut-img'));
});


gulp.task("default",["scss", "serve"]);