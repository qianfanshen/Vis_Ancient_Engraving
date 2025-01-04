// scatterFunctions.js

function initializeScatterPlot() {
  d3.json("assets/data.json").then(data => {
    const svg = d3.select("#scatterplot");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // 抽取数据点
    const categories = Object.keys(data);
    const flattenedData = [];
    categories.forEach((category, i) => {
      data[category].forEach(d => {
        flattenedData.push({ ...d, category });
      });
    });

    // 创建比例尺
    const xScale = d3.scaleLinear()
      .domain([0, flattenedData.length])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([0, categories.length])
      .range([height - margin.bottom, margin.top]);

    // 绘制散点
    svg.selectAll("circle")
      .data(flattenedData)
      .enter()
      .append("circle")
      .attr("cx", (d, i) => xScale(i))
      .attr("cy", d => yScale(categories.indexOf(d.category)))
      .attr("r", 6)
      .attr("fill", d => colorScale(d.category))
      .on("click", (event, d) => showDetails(d));

    // 绘制 X/Y 轴
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(10));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).ticks(categories.length).tickFormat(i => categories[i]));

    // 显示详细信息
    function showDetails(data) {
      const detailsPanel = d3.select("#details");
      detailsPanel.html(`
        <h3>详细信息</h3>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      `);
    }
  });
}

initializeScatterPlot();