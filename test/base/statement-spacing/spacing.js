/* oxlint-disable no-undef no-unused-vars */
(async () => {
	// The first const value.
	const firstValue = 1;

	// The second const value.
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	const secondValue = 2;

	// The first let value.
	let firstCount = 0;

	// The second let value.
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	let secondCount = 1;

	await loadValue();
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	const afterAwait = 1;
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	clearPaneFailures();
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	const afterConst = 2;

	urlInput.value = url;
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	clearPaneFailures();
	clearPaneFailures();
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	urlInput.value = url;

	urlInput.value = url;
	urlInput.value = loadValue();
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	clearPaneFailures();
	clearPaneFailures();
	bar();
	foo((x = 1));

	for (const item of items) {
		useItem(item);
	}
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	clearPaneFailures();
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	for (const item of items) useItem(item);
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	clearPaneFailures();
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	while (isReady) clearPaneFailures();
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	clearPaneFailures();
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	do clearPaneFailures();
	while (isReady);
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	clearPaneFailures();

	/**
	 * Run the function spacing case.
	 */
	function functionDeclaration() {}
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	clearPaneFailures();

	/**
	 * Represent the class spacing case.
	 */
	class ClassDeclaration {}
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	clearPaneFailures();

	if (isReady) {
		clearPaneFailures();
	}
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	clearPaneFailures();
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	if (isReady) clearPaneFailures();
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	clearPaneFailures();
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	switch (value) {
		case 1:
			clearPaneFailures();
			// oxlint-disable-next-line @stylistic/padding-line-between-statements
			break;
	}
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	clearPaneFailures();
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	try {
		clearPaneFailures();
	} catch {
		clearPaneFailures();
	}
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	clearPaneFailures();

	const multilineValue = {
		first: 1,
		second: 2,
	};
	// oxlint-disable-next-line @stylistic/padding-line-between-statements
	clearPaneFailures();
})();
