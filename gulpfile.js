const del = require("del");
const gulp = require('gulp');
const sync = require("browser-sync").create();
const less = require("gulp-less");
const csso = require("postcss-csso");
const rename = require("gulp-rename");
const uglify = require("gulp-uglify-es").default;
const htmlmin = require("gulp-htmlmin");
const postcss = require("gulp-postcss");
const plumber = require("gulp-plumber");
const cheerio = require("gulp-cheerio");
const imagemin = require("gulp-imagemin");
const svgstore = require("gulp-svgstore");
const sourcemap = require("gulp-sourcemaps");
const autoprefixer = require("autoprefixer");


// Clean (Delete "build" Directory)
const clean = () => {
  return del("build")
}
exports.clean = clean;

// Minify HTML
const minifyHtml = () => {
  return gulp.src("source/*.html")
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest("build/"))
    .pipe(sync.stream());
}
exports.minifyHtml = minifyHtml;

// Minify JavaScript
const minifyJs = () => {
  return gulp.src("source/js/script.js")
    .pipe(rename("script.min.js"))
    .pipe(uglify())
    .pipe(gulp.dest("build/js/"))
}
exports.minifyJs = minifyJs;

// Copy FONTS and IMAGES to "build".
// If "build" does not exist it creates a dirctory "build"
const copy = () => {
  return gulp.src([
    "source/img/*.{png,jpg,svg}",
    "source/fonts/*.{woff,woff2}",
  ],
  {
    base: "source"
  })
    .pipe(gulp.dest("build/"))
}
exports.copy = copy;

// Combine SVG files
const sprite = () => {
  return gulp.src("source/img/icon/*.svg")
    .pipe(imagemin([
      imagemin.svgo({
        plugins: [
          {removeViewBox: false},
          {removeUselessStrokeAndFill: true}
      ]
      })
    ]))
    .pipe(svgstore())
    .pipe(cheerio({
      run: function ($) {
          $('svg').attr('style',  'display:none');
      },
      parserOptions: { xmlMode: true }
    }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img/"))
}
exports.sprite = sprite;

// Styles
const styles = () => {
  return gulp.src("source/less/style.less")
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(less())
    .pipe(postcss([
      autoprefixer(),
      csso()
    ]))
    .pipe(sourcemap.write("."))
    .pipe(rename("style.min.css"))
    .pipe(gulp.dest("build/css"))
    .pipe(sync.stream());
}
exports.styles = styles;


// Server
const server = (done) => {
  sync.init({
    server: {
      baseDir: 'build'
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}

// Watcher
const watcher = () => {
  gulp.watch("source/less/**/*.less", gulp.series("styles"));
  gulp.watch("source/*.html").on("change",  gulp.series("minifyHtml"));
}

// Build
const build = gulp.series (
  clean,
  styles,
  gulp.parallel (
    copy,
    sprite,
    minifyJs,
    minifyHtml
  )
);
exports.build = build;

exports.default = gulp.series (
  styles,
  server,
  watcher
);
