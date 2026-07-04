export function handleTabKeydown(event, tabs, activate) {
  const button = event.target.closest("button[data-tab]");
  if (!button) return;
  const enabledTabs = tabs.filter((item) => !item.disabled);
  const index = enabledTabs.indexOf(button);
  if (index === -1) return;

  const nextIndex = getNextTabIndex(event.key, index, enabledTabs.length);
  if (nextIndex === -1) return;

  event.preventDefault();
  const nextButton = enabledTabs[nextIndex];
  nextButton.focus({ preventScroll: true });
  activate(nextButton.dataset.tab);
}

export function getNextTabIndex(key, currentIndex, tabCount) {
  if (key === "ArrowRight" || key === "ArrowDown") return (currentIndex + 1) % tabCount;
  if (key === "ArrowLeft" || key === "ArrowUp") return (currentIndex - 1 + tabCount) % tabCount;
  if (key === "Home") return 0;
  if (key === "End") return tabCount - 1;
  return -1;
}
