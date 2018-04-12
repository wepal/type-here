function onClick(info, tab) {
  chrome.tabs.sendMessage(tab.id, "typeHere", function(response) {
  });
}

chrome.contextMenus.create({"title": "type here", "contexts":["selection"],
                                       "onclick": onClick});
