var gulp      = require('gulp'),
    uglify    = require('gulp-uglify'),
    concat    = require('concat'),
    minifyCSS = require('gulp-minify-css');


gulp.task('watch', function() {
  gulp.watch('js/*.js', ['minify']);
  gulp.watch('css/*.css', ['css']);
});

gulp.task('css', function() {
  gulp.src('css/*.css')
      .pipe(minifyCSS())
      //.pipe(concat('styles.css'))
      .pipe(gulp.dest('./build/css'));
});

gulp.task('minify', function() {
  gulp.src('js/*.js')
      .pipe(uglify)
      .pipe(concat('app.min.js'))
      .pipe(gulp.dest('./build/js'));
});

gulp.task('default',['watch', 'css', 'minify'], function() {});

