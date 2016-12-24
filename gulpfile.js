var gulp      = require('gulp'),
    uglify    = require('gulp-uglify'),
    concat    = require('gulp-concat'),
    minifyCSS = require('gulp-minify-css');


gulp.task('watch', function() {
  gulp.watch('js/*.js', ['minify']);
  gulp.watch('css/*.css', ['css']);
});

gulp.task('css', function() {
  gulp.src('css/*.css')
      .pipe(concat('styles.min.css'))
      .pipe(minifyCSS())
      .pipe(gulp.dest('./build/css'));
});

gulp.task('minify', function() {
  gulp.src('js/*.js')
      .pipe(uglify()).on('error', function(e) { console.log(e); })
      .pipe(concat('app.min.js'))
      .pipe(gulp.dest('./build/js'));
});

gulp.task('default',['watch', 'css', 'minify'], function(e) {
  console.log(e)
});
