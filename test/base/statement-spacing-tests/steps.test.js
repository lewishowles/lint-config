/* oxlint-disable no-undef no-unused-vars */
describe("Test statement spacing", () => {
	test("keeps the data table steps", async () => {
		await cardSort.selectOption("title");

		await expect(direction).toHaveCount(1);
		await expect(direction).toHaveAccessibleName("Direction: Ascending order");
		await expect(cardSort.locator("option")).toHaveText([
			"Title",
			"Release year",
			"Box office ($m)",
		]);
		await expect(page.getByTestId("data-table-row").first()).toContainText("Aladdin");

		await direction.focus();
		await direction.press("Space");

		await expect(direction).toHaveAccessibleName("Direction: Descending order");
		await expect(page.getByTestId("data-table-row").first()).toContainText("Up");

		await cardSelectAll.focus();
		await cardSelectAll.press("Space");

		await expect(cardSelectAll).toBeChecked();
	});

	test("allows adjacent and separated expression steps", async () => {
		await expect(cardSort.locator("option")).toHaveText([
			"Title",
			"Release year",
			"Box office ($m)",
		]);
		await direction.focus();
		await direction.press("Space");

		direction.value = "asc";
		checkDirection();

		direction.value = "desc";

		checkDirection();

		const firstValue = 1;
		const secondValue = 2;
		// oxlint-disable-next-line @stylistic/padding-line-between-statements
		checkDirection();

		checkDirection();
		// oxlint-disable-next-line @stylistic/padding-line-between-statements
		if (isReady) {
			checkDirection();
		}

		checkDirection();
		// oxlint-disable-next-line @stylistic/padding-line-between-statements
		for (const item of items) {
			checkDirection(item);
		}
	});
});
