module.exports = function(config) {
	config.set({
		basePath: '',
		frameworks: ['mocha', 'chai'],
		files: ['libs/*.js', 'src/**/*.js', 'tests/**/*.js'],
		reporters: ['progress'],
		autoWatch: true,
		browsers: ['PhantomJS'],

		plugins: [
			'karma-mocha',
			'karma-chai',
			'karma-phantomjs-launcher'
		]
	});
};