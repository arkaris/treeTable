"use strict";

// init таблицы (классы, евенты)
var table = new Table({
	tableId: "table",
	columns: [{
		key: "id",
		title: "id"
	}, {
		key: "name",
		title: "name"
	}, {
		key: "email",
		title: "email"
	}, {
		key: "balance",
		title: "balance"
	}, {
		key: "isActive",
		title: "isActive"
	}]
});

// лень заводить вебсервер, но если подставить урл, то должно заработать
var sDataUrl = "";

// запрос данных
new Dp().getData(sDataUrl)
// обработка
.then(function(responseData) {
	// скручиваю данные в дерево
	var indexedData = responseData.reduce(function(acc, item) {
		var index = item["id"];
		if (acc[index]) {
			alert("unique id violation: " + index);
		} else {
			acc[index] = item;
		}
		return acc;
	}, {});

	var tree = {children: []};
	for (var index in indexedData) {
		var item = indexedData[index];
		var parentId = item.parentId;
		var parent = indexedData[parentId];
		if (parentId === 0) {
			tree.children.push(item);
			tree.expanded = true;
			tree.level = 0;
			item.level = 1;
		} else if (!parent) {
			alert("missed parent item: " + item["id"]);
			tree.children.push(item);
			tree.expanded = true;
			tree.level = 0;
			item.level = 1;
		} else if (!parent.children) {
			parent.children = [];
			parent.children.push(item);
			parent.expanded = false;
			item.level = parent.level + 1;
		} else {
			parent.children.push(item);
			parent.expanded = false;
			item.level = parent.level + 1;
		}
	}
	// цепляю данные к таблице, рендерю строки корня
	table.setData({
		indexed: indexedData,
		tree: tree
	}, true);
})

// событие загрузки dom
document.addEventListener("DOMContentLoaded", function() {
	function getFnFilter(filterType) {
		var fnFilter;
		switch (filterType) {
			case "act":
				fnFilter = function(dataRow) {
					return dataRow.isActive == true;
				}
				break;
			case "notact":
				fnFilter = function(dataRow) {
					return dataRow.isActive != true;
				}
				break;
			default:
				fnFilter = null;
		}
		return fnFilter;
	}
	// вешаю обработчик изменения фильтра
	var domSelect = document.getElementById("select");
	domSelect.onchange = function(event) {
		table.setFilter(getFnFilter(event.target.value), true);
	}
	// назначаю фильтр первый раз руками
	table.setFilter(getFnFilter(domSelect.value));

	// инит (и отложенный рендер после setData) таблицы
	table.init();
});