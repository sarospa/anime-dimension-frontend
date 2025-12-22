displayRows = {
	"Title": {displayName: "Title", width: "35%"},
	"Notes": {displayName: "Notes", width: "30%"},
	"YuriRatingId": {displayName: "Yuri Rating", width: "5%"},
	"ReleaseDate": {displayName: "Release Date", width: "5%"},
	"LastEpisode": {displayName: "Last Episode", width: "5%"},
	"Source": {displayName: "Source", width: "5%"},
	"Priority": {displayName: "Priority", width: "5%"}
}
queryColumns = {
	"AnimeId": "text",
	"Title": "text",
	"Review": "text",
	"Notes": "text",
	"YuriRatingId": [[0, "No yuri"], [1, "Little yuri"], [2, "Weak yuri"], [3, "Strong yuri"], [4, "Explicit yuri"], [5, "Very explicit yuri"], [6, "Overwhelming yuri"]],
	"ReleaseDate": "text",
	"LastEpisode": "text",
	"Priority": [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [7, 7], [8, 8], [9, 9], [10, 10]],
	"Completion": [[0, "New"], [1, "Started"], [2, "One season"], [3, "All main episodes"], [4, "Everything"]],
}
columns = [];
data = [];
partnersList = [];
queryCount = 0;

$.when($.ready).then(async function() {
	try {
		const response = await fetch(`${baseURL}/allanime`);
		if (!response.ok) {
		  throw new Error(`Response status: ${response.status}`);
		}
		
		const result = await response.json();
		columns = result["message"]["columns"];
		data = result["message"]["rows"]
		
		const partnersResponse = await fetch(`${baseURL}/watchpartners`);
		if (!partnersResponse.ok) {
			throw new Error(`Response status: ${partnersResponse.status}`);
		}
		
		const partnersResult = await partnersResponse.json();
		partnersList = partnersResult["message"]["rows"];
		queryColumns["WatchPartners"] = partnersList;
		queryColumns["WatchPartnersActive"] = partnersList;
		
		let partnersDropdown = $("#partnerSearch");
		for (let row = 0; row < partnersList.length; row++) {
			let rowData = partnersList[row];
			partnersDropdown.append($(`<option value=${rowData[0]}>${rowData[1]}</option>`));
		}
		
		const sourcesResponse = await fetch(`${baseURL}/sources`);
		if (!sourcesResponse.ok) {
		  throw new Error(`Response status: ${sourcesResponse.status}`);
		}
		
		const sources = await sourcesResponse.json();
		queryColumns["SourceId"] = sources["message"]["rows"];
		
		const tagsResponse = await fetch(`${baseURL}/tags`);
		if (!tagsResponse.ok) {
			throw new Error(`Response status: ${tagsResponse.status}`);
		}
		
		const tagsData = await tagsResponse.json();
		queryColumns["TagIds"] = tagsData["message"]["rows"];
		
		buildTable();
	} catch (error) {
		console.error(error.message);
	}
});

function find(row, column) {
	return row[columns.findIndex((col) => col === column)]
}

function buildTable(queries) {
	let table = $("#animetable");
	table.empty();
	
	let headerRow = $("<tr>");
	for (let col = 0; col < columns.length; col++) {
		let columnName = columns[col];
		if (Object.keys(displayRows).includes(columnName)) {
			headerRow.append($(`<th style='width: ${displayRows[columnName].width}'>${displayRows[columnName].displayName}</th>`));
		}
	}
	table.append(headerRow);
	
	let reviewIndex = columns.findIndex((col) => col === "Review");
	let completionIndex = columns.findIndex((col) => col === "Completion");
	
	let isEven = true;
	for (let row = 0; row < data.length; row++) {
		let activePartners = find(data[row], "WatchPartnersActive")?.split(",");
		if (foundInQuerySearch(data[row], queries)) {
			let parity = isEven ? "even" : "odd"
			isEven = !isEven;
			let rowElem = $(`<tr class='${parity}'>`);
			for (let col = 0; col < data[row].length; col++) {
				let columnName = columns[col];
				if (Object.keys(displayRows).includes(columnName)) {
					let cellData = data[row][col];
					if (columnName === "Notes" && cellData.length >= 50) {
						cellData = cellData.substring(0, 50) + "...";
					}
					else if (columnName === "Title") {
						cellData = `<a href="/neweditanime.html?animeid=${data[row][0]}">${cellData}</a>`
					}
					if (cellData === null) cellData = "";
					rowElem.append($(`<td>${cellData}</td>`));
				}
			}
			table.append(rowElem);
		}
	}
}

async function navigateToRandomAnime() {
	const response = await fetch(`${baseURL}/randomanime`);
	if (!response.ok) {
	  throw new Error(`Response status: ${response.status}`);
	}
	
	const result = await response.json();
	window.location.href = `/neweditanime.html?animeid=${result["message"]}`
}

async function downloadBackup() {
	window.location.href = `${baseURL}/backup`;
}

function updateQueryValueField(queryNumber) {
	let column = $(`#query-${queryNumber} .columnDropdown`).val();
	if (queryColumns[column] == "text") {
		$(`#query-${queryNumber} .queryValue`).replaceWith($("<input type='text' class='queryValue' onkeyup='querySearch()' />"));
	}
	else if (queryColumns[column]) {
		let newQueryValue = $(`<select class='queryValue' onchange='querySearch()'></select`);
		for (let i = 0; i < queryColumns[column].length; i++) {
			newQueryValue.append($(`<option value=${queryColumns[column][i][0]}>${queryColumns[column][i][1]}</option>`))
		}
		$(`#query-${queryNumber} .queryValue`).replaceWith(newQueryValue);
	}
	querySearch();
}

function toggleQueryValueField(queryNumber) {
	let op = $(`#query-${queryNumber} .opDropdown`).val();
	let valueField = $(`#query-${queryNumber} .queryValue`);
	if (op == "EMPTY") {
		$(`#query-${queryNumber} .queryValue`).remove();
	}
	else if (valueField.length == 0) {
		$(`#query-${queryNumber}`).append($("<input type='text' class='queryValue' onkeyup='querySearch()' />"));
		updateQueryValueField(queryNumber);
	}
	querySearch();
}

function deleteQuery(queryNumber) {
	$(`#query-${queryNumber}`).remove();
	querySearch();
}

function querySearch() {
	let dropdownDiv = $("#queryDropdowns");
	let queries = [];
	for (let i = 0; i < queryCount; i++) {
		let column = $(`#query-${i} .columnDropdown`).val();
		let operator = $(`#query-${i} .opDropdown`).val();
		let value = $(`#query-${i} .queryValue`).val();
		queries.push([column, operator, value]);
	}
	buildTable(queries)
}

function foundInQuerySearch(row, queries) {
	if (!queries) return true;
	let found = true;
	for (let i = 0; i < queries.length; i++) {
		let query = queries[i];
		let rowValue = find(row, query[0])?.toString().toLowerCase();
		let operator = query[1];
		let value = query[2]?.toString().toLowerCase();
		let rowArr = rowValue?.split(",");
		switch(operator) {
			case "IS":
				if (!(rowValue == value)) found = false;
				break;
			case "NOT":
				if (!(rowValue != value)) found = false;
				break;
			case "<":
				if (!(rowValue < value)) found = false;
				break;
			case "<=":
				if (!(rowValue <= value)) found = false;
				break;
			case ">":
				if (!(rowValue > value)) found = false;
				break;
			case ">=":
				if (!(rowValue >= value)) found = false;
				break;
			case "MATCHES":
				if (!rowValue.includes(value)) found = false;
				break;
			case "HAS":
				if (!rowArr || !rowArr.includes(value)) found = false;
				break;
			case "NOT HAS":
				if (rowArr && rowArr.includes(value)) found = false;
				break;
			case "EMPTY":
				if (rowValue) found = false;
				break;
			case "NOT EMPTY":
				if (!rowValue) found = false;
				break;
		}
	}
	return found;
}

async function addQuery() {
	let dropdownDiv = $("#queryDropdowns");
	let newSpan = $(`<div id='query-${queryCount}'></div>`);
	let colDropdown = $(`<select class='columnDropdown' onchange='updateQueryValueField(${queryCount})'></select>`)
	for (let i = 0; i < columns.length; i++) {
		if (queryColumns[columns[i]]) {
			colDropdown.append($(`<option value='${columns[i]}'>${columns[i]}</option>`));
		}
	}
	newSpan.append(colDropdown);
	newSpan.append($(`<select class='opDropdown' onchange='toggleQueryValueField(${queryCount})'>
			<option value='IS'>IS</option>
			<option value='NOT'>NOT</option>
			<option value='&lt;'>&lt;</option>
			<option value='&lt;='>&lt;=</option>
			<option value='&gt;'>&gt;</option>
			<option value='&gt;='>&gt;=</option>
			<option value='MATCHES'>MATCHES</option>
			<option value='HAS'>HAS</option>
			<option value='NOT HAS'>NOT HAS</option>
			<option value='EMPTY'>EMPTY</option>
			<option value='NOT EMPTY'>NOT EMPTY</option>
		</select>`));
	newSpan.append($("<input type='text' class='queryValue' onkeyup='querySearch()' />"));
	newSpan.append($(`<button onclick='deleteQuery(${queryCount})'>X</button>`))
	dropdownDiv.append(newSpan);
	queryCount++;
}

async function presetQuery(queryData) {
	for (let i = 0; i < queryData.length; i++) {
		addQuery();
		let newQuery = $(`#query-${queryCount - 1}`);
		let columnDropdown = newQuery.children(".columnDropdown");
		columnDropdown.val(queryData[i][0]).change();
		let opDropdown = newQuery.children(".opDropdown");
		opDropdown.val(queryData[i][1]).change();
		let queryValue = newQuery.children(".queryValue");
		if (queryValue.length > 0) queryValue.val(queryData[i][2]);
	}
	querySearch();
}