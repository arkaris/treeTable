"use strict";

function Table(oCfg) {
	// ==============================
	// инициализация
	// ==============================

	var tableId = oCfg.tableId;
	var columnsCfg = oCfg.columns;
	var tableData = [];
	var tableFilter = null;

	// конструктор требует id dom элемента сразу
	// на случай выполнения скрипта до появления dom элемента добавляю промис
	// промис резолвится ссылкой на dom элемент таблицы
	var resolveReady;
	this.ready = new Promise(function(resolve, reject) {
		resolveReady = resolve;
	});

	// рендерит костяк таблицы, резолвит this.ready
	this.init = function() {
		var domTable = document.getElementById(tableId);
		if (domTable) {
			renderBase(domTable)
			domTable.onclick = onTableClick;
			resolveReady(domTable);
		}
		return this;
	}

	this.setFilter = function(fnFilter, bRerender) {
		if (typeof fnFilter == "function") {
			tableFilter = fnFilter;
		} else {
			tableFilter = function(){return true;}
		}

		if (bRerender) {
			this.rerenderTableContent();
		}
	}

	// ==============================
	// рендеринг
	// ==============================

	function renderBase(domTable) {
		domTable.classList.add("tree-table");
		var columnHtml = columnsCfg.map(function(cfg) {
			return "<th><text>" + cfg.title + "</text></th>";
		});
		domTable.innerHTML = "<thead><tr>" + columnHtml.join("") + "</tr></thead><tbody></tbody>";
	}

	this.setData = function(oData, bRerender) {
		tableData = oData;
		if (bRerender) {
			this.rerenderTableContent();
		}
	};

	var renderInProcess = false;
	this.rerenderTableContent = function(bRerender) {
		if (!renderInProcess) {
			renderInProcess = true;
			this.ready.then(function(domTable) {
				renderInProcess = false;
				var domTBody = domTable.getElementsByTagName("tbody")[0];
				domTBody.innerHTML = "";
				renderChildren(domTBody);
			});
		}
	}

	function renderChildren(domParent) {
		function craftRow(dataRow) {
			var domRow = document.createElement("tr");
			updateClasses(domRow, dataRow);
			domRow.setAttribute("data-id", dataRow.id);
			domRow.setAttribute("data-level", dataRow.level);
			var rowHtml = columnsCfg.map(function(cfg) {
				return "<td><text>" + dataRow[cfg.key] + "</text></td>";
			});
			rowHtml[0] = rowHtml[0].replace(/^<td/, '<td style="padding-left:' + (15*dataRow.level) + 'px"');
			domRow.innerHTML = rowHtml.join("");
			return domRow;
		}
		if (domParent.tagName == "TBODY") {
			tableData.tree.children
			.filter(tableFilter)
			.forEach(function(dataRow) {
				var domChild = craftRow(dataRow);
				domParent.append(domChild);
				if (dataRow.expanded) {
					renderChildren(domChild);
				}
			});
		} else if (domParent.tagName == "TR") {
			var dataId = domParent.getAttribute("data-id");
			tableData.indexed[dataId].children
			.filter(tableFilter)
			.forEach(function(dataRow) {
				var domChild = craftRow(dataRow);
				domParent.after(domChild);
				if (dataRow.expanded) {
					renderChildren(domChild);
				}
			});
		}
	}

	function updateClasses(domElement, rowData) {
		if (rowData.children) {
			if (rowData.expanded) {
				domElement.classList.remove("expandable");
				domElement.classList.add("expanded");
			} else {
				domElement.classList.remove("expanded");
				domElement.classList.add("expandable");
			}
		}
	}

	// ==============================
	// схлопывание
	// ==============================

	function collapseChildren(domParent) {
		var dataId = domParent.getAttribute("data-id");
		var rowData = tableData.indexed[dataId];
		rowData.expanded = false;
		updateClasses(domParent, rowData);
		var parentLevel = domParent.getAttribute("data-level");
		while (domParent.nextSibling && domParent.nextSibling.getAttribute("data-level") > parentLevel) {
			domParent.nextSibling.remove();
		}
	}

	// ==============================
	// евенты
	// ==============================

	function onTableClick(event) {
		var td = event.target.closest('td');
		var tr = event.target.closest('tr');
		if (tr && tr.firstChild == td) {
			var dataId = tr.getAttribute("data-id");
			var rowData = tableData.indexed[dataId];
			if (rowData && rowData.children) {
				if (rowData.expanded) {
					rowData.expanded = false;
					collapseChildren(tr);
				} else {
					rowData.expanded = true;
					renderChildren(tr);
				}
				updateClasses(tr, rowData);
			}
		}
	}

}