// chartFunctions.js

// 页面 1 的折线图初始化函数
function initializeChartPage2() {
    d3.json("assets/data1.json").then(data => {

      const margin = { top: 50, right: 80, bottom: 50, left: 80 };
      const width = 800 - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;

      const svg = d3.select("svg")
                    .append("g")
                    .attr("transform", `translate(${margin.left},${margin.top})`);

      // 2. 定义 X 轴和 Y 轴
      const xScale = d3.scalePoint()
                      .domain(data.map(d => d.period))
                      .range([0, width])
                      .padding(0.5);

      const yScale = d3.scaleLinear()
                      .domain([0, d3.max(data, d => Math.max(d["刻本"], d["印本"], d["抄本"], d["修本"]))])
                      .range([height, 0]);

      // 3. 画 X 轴和 Y 轴
      svg.append("g")
         .attr("transform", `translate(0, ${height})`)
         .call(d3.axisBottom(xScale))
         .style("font-size", "24px")
         .style("font-family", "KaiTi");

      svg.append("g")
         .call(d3.axisLeft(yScale))
         .style("font-size", "24px");

      // 4. 定义颜色
      const colors = {
        "刻本": "#696969",
        "印本": "#DDA0DD",
        "抄本": "#CD5C5C",
        "修本": "#808000"
      };

      // 5. 画折线
      const line = d3.line()
                    .x(d => xScale(d.period))
                    .y(d => yScale(d.value))
                    .curve(d3.curveMonotoneX);

      const categories = ["刻本", "印本", "抄本", "修本"];
      const visibility = { "刻本": true, "印本": true, "抄本": true, "修本": true };

      categories.forEach(category => {
        // 创建折线
        const path = svg.append("path")
                        .datum(data.map(d => ({ period: d.period, value: d[category] }))) // 使用该类别的数据
                        .attr("fill", "none")
                        .attr("stroke", colors[category])
                        .attr("stroke-width", 2)
                        .attr("class", `line ${category}`)
                        .attr("d", line)
                        .style("stroke-dasharray", function() {
                          const length = this.getTotalLength();
                          return `${length} ${length}`;
                        })
                        .style("stroke-dashoffset", function() {
                          return this.getTotalLength();
                        })
                        .transition()
                        .duration(1000)
                        .style("stroke-dashoffset", 0); // 动画过渡显示折线

        // 添加每个数据点
        svg.selectAll(`.dot.${category}`)
           .data(data)
           .enter()
           .append("circle")
           .attr("class", `dot ${category}`)
           .attr("cx", d => xScale(d.period))
           .attr("cy", d => yScale(d[category]))
           .attr("r", 5)
           .attr("fill", colors[category])
           .style("opacity", 0) // 初始时点不可见
           .transition()
           .duration(2000)
           .delay((d, i) => i * 200) // 每个点逐步显现
           .style("opacity", 1); // 过渡显示点

      });

      // 6. 图例（可点击隐藏/显示）
    //   const legend = svg.selectAll(".legend")
    //                     .data(categories)
    //                     .enter()
    //                     .append("g")
    //                     .attr("class", "legend")
    //                     .attr("transform", (d, i) => `translate(${i * 150}, ${height + 50})`)
    //                     .on("click", function(event, category) {
    //                         visibility[category] = !visibility[category]; // 切换可见性
    //                         d3.select(`.line.${category}`).style("display", visibility[category] ? "block" : "none");
    //                         d3.selectAll(`.dot.${category}`).style("display", visibility[category] ? "block" : "none");
    //                     });

    //   legend.append("rect")
    //         .attr("width", 15)
    //         .attr("height", 15)
    //         .attr("fill", d => colors[d]);

    //   legend.append("text")
    //         .attr("x", 30)
    //         .attr("y", 20)
    //         .text(d => d)
    //         .style("cursor", "pointer");

      // 7. 创建折线选择按钮
      const buttonContainer = svg.append("g")
                                 .attr("transform", `translate(0, ${height + 80})`);

      categories.forEach((category, i) => {
        buttonContainer.append("rect")
                       .attr("x", i * 150+30)
                       .attr("y", 0)
                       .attr("width", 130)
                       .attr("height", 50)
                       .attr("fill", colors[category])
                       .style("cursor", "pointer")
                       .on("click", function() {
                           visibility[category] = !visibility[category]; // 切换可见性
                           d3.select(`.line.${category}`).style("display", visibility[category] ? "block" : "none");
                           d3.selectAll(`.dot.${category}`).style("display", visibility[category] ? "block" : "none");
                       });

        buttonContainer.append("text")
                       .attr("x", i * 150 + 95)
                       .attr("y", 35)
                       .attr("text-anchor", "middle")
                       .attr("fill", "#fff")
                       .style("font-size", "30px")
                       .style("font-family", "KaiTi", "STKaiti", "楷体", "Kaiti SC")
                       .text(category);
      });

    });
  }







  // 页面 3 的折线图初始化函数
  function initializeChartPage3(selectedCategory = "all") {
    const svg = d3.select("#scatterplot")
    .attr("width", 1500) // 增加宽度
    .attr("height", 800); // 增加高度
    const width = +svg.attr("width"); // Ensure width is a number
    const height = +svg.attr("height"); // Ensure height is a number

    d3.json("assets/data.json").then(function(data) {
        // Process data
        let books = [];
        for (let [history, entries] of Object.entries(data)) {
            entries.forEach(entry => {
                entry.history = history;
                books.push(entry);
            });
        }

        // Filter data
        if (selectedCategory !== "all") {
            books = books.filter(d => d.history === selectedCategory);
        }

        // Color scale
        let histories = [...new Set(books.map(d => d.history))];
        let color = d3.scaleOrdinal()
            .domain(histories)
            .range(d3.schemeSet2);

        // Force simulation
        let simulation = d3.forceSimulation(books)
            .force("charge", d3.forceManyBody().strength(-60)) // 增加斥力强度
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(20)) // 调整碰撞半径
            .force("x", d3.forceX(width / 2).strength(0.1)) // 增加水平对齐的强度
            .force("y", d3.forceY(height / 2).strength(0.1)) // 增加垂直对齐的强度
            .force("boundary", forceBoundary(width, height, books)); // 边界限制

        // Draw circles
        let circles = svg.selectAll("circle")
            .data(books)
            .enter()
            .append("circle")
            .attr("r", 8)
            .attr("fill", d => color(d.history))
            .on("mouseover", showDetails)
            .on("mouseout", hideDetails);

        // Update node positions
        simulation.on("tick", () => {
            circles
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
        });

        // Legend
        let legend = svg.append("g")
            .attr("class", "legend")
            .selectAll("g")
            .data(histories)
            .enter()
            .append("g")
            .attr("transform", (d, i) => `translate(0,${100 + i * 20})`);

        legend.append("rect")
            .attr("x", width + 25)
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", d => color(d));

        legend.append("text")
            .attr("x", width + 50)
            .attr("y", 9)
            .attr("dy", ".35em")
            .text(d => d);

        // Details panel
        function showDetails(event, d) {
            d3.select("#details")
                .html(`
                    <h3>${d.title}</h3>
                    <p><strong>类别:</strong> ${d.category}</p>
                    <p><strong>版本类型:</strong> ${d.version_type}</p>
                    <p><strong>出版时间:</strong> ${d.publication_time}</p>
                    <p><strong>四部分类:</strong> ${d.four_part_classification}</p>
                    <p><strong>馆藏省份:</strong> ${d.library_province}</p>
                `)
                .style("display", "block");
        }

        function hideDetails(event, d) {
            d3.select("#details").style("display", "none");
        }
    });
}

  // Boundary force function
  function forceBoundary(width, height, nodes) {
      return function force() {
          for (let i = 0, n = nodes.length; i < n; ++i) {
              let node = nodes[i];
              node.x = Math.max(10, Math.min(width - 10, node.x)); // Keep nodes within horizontal bounds
              node.y = Math.max(10, Math.min(height - 10, node.y)); // Keep nodes within vertical bounds
          }
      };
  }




// 页面 1 的折线图初始化函数
function initializeChartPageTypeDist() {
    d3.json("assets/data1.json").then(data => {

      const margin = { top: 50, right: 80, bottom: 50, left: 80 };
      const width = 800 - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;

      const svg = d3.select("svg")
                    .append("g")
                    .attr("transform", `translate(${margin.left},${margin.top})`);

      // 2. 定义 X 轴和 Y 轴
      const xScale = d3.scalePoint()
                      .domain(data.map(d => d.period))
                      .range([0, width])
                      .padding(0.5);

      const yScale = d3.scaleLinear()
                      .domain([0, d3.max(data, d => Math.max(d["刻本"], d["印本"], d["抄本"], d["修本"]))])
                      .range([height, 0]);

      // 3. 画 X 轴和 Y 轴
      svg.append("g")
         .attr("transform", `translate(0, ${height})`)
         .call(d3.axisBottom(xScale))
         .style("font-size", "24px")
         .style("font-family", "KaiTi");

      svg.append("g")
         .call(d3.axisLeft(yScale))
         .style("font-size", "24px");

      // 4. 定义颜色
      const colors = {
        "刻本": "#696969",
        "印本": "#DDA0DD",
        "抄本": "#CD5C5C",
        "修本": "#808000"
      };

      // 5. 画折线
      const line = d3.line()
                    .x(d => xScale(d.period))
                    .y(d => yScale(d.value))
                    .curve(d3.curveMonotoneX);

      const categories = ["刻本", "印本", "抄本", "修本"];
      const visibility = { "刻本": true, "印本": true, "抄本": true, "修本": true };

      categories.forEach(category => {
        // 创建折线
        const path = svg.append("path")
                        .datum(data.map(d => ({ period: d.period, value: d[category] }))) // 使用该类别的数据
                        .attr("fill", "none")
                        .attr("stroke", colors[category])
                        .attr("stroke-width", 2)
                        .attr("class", `line ${category}`)
                        .attr("d", line)
                        .style("stroke-dasharray", function() {
                          const length = this.getTotalLength();
                          return `${length} ${length}`;
                        })
                        .style("stroke-dashoffset", function() {
                          return this.getTotalLength();
                        })
                        .transition()
                        .duration(1000)
                        .style("stroke-dashoffset", 0); // 动画过渡显示折线

        // 添加每个数据点
        svg.selectAll(`.dot.${category}`)
           .data(data)
           .enter()
           .append("circle")
           .attr("class", `dot ${category}`)
           .attr("cx", d => xScale(d.period))
           .attr("cy", d => yScale(d[category]))
           .attr("r", 5)
           .attr("fill", colors[category])
           .style("opacity", 0) // 初始时点不可见
           .transition()
           .duration(2000)
           .delay((d, i) => i * 200) // 每个点逐步显现
           .style("opacity", 1); // 过渡显示点

      });

      // 6. 图例（可点击隐藏/显示）
    //   const legend = svg.selectAll(".legend")
    //                     .data(categories)
    //                     .enter()
    //                     .append("g")
    //                     .attr("class", "legend")
    //                     .attr("transform", (d, i) => `translate(${i * 150}, ${height + 50})`)
    //                     .on("click", function(event, category) {
    //                         visibility[category] = !visibility[category]; // 切换可见性
    //                         d3.select(`.line.${category}`).style("display", visibility[category] ? "block" : "none");
    //                         d3.selectAll(`.dot.${category}`).style("display", visibility[category] ? "block" : "none");
    //                     });

    //   legend.append("rect")
    //         .attr("width", 15)
    //         .attr("height", 15)
    //         .attr("fill", d => colors[d]);

    //   legend.append("text")
    //         .attr("x", 30)
    //         .attr("y", 20)
    //         .text(d => d)
    //         .style("cursor", "pointer");

      // 7. 创建折线选择按钮
      const buttonContainer = svg.append("g")
                                 .attr("transform", `translate(0, ${height + 80})`);

      categories.forEach((category, i) => {
        buttonContainer.append("rect")
                       .attr("x", i * 150+30)
                       .attr("y", 0)
                       .attr("width", 130)
                       .attr("height", 50)
                       .attr("fill", colors[category])
                       .style("cursor", "pointer")
                       .on("click", function() {
                           visibility[category] = !visibility[category]; // 切换可见性
                           d3.select(`.line.${category}`).style("display", visibility[category] ? "block" : "none");
                           d3.selectAll(`.dot.${category}`).style("display", visibility[category] ? "block" : "none");
                       });

        buttonContainer.append("text")
                       .attr("x", i * 150 + 95)
                       .attr("y", 35)
                       .attr("text-anchor", "middle")
                       .attr("fill", "#fff")
                       .style("font-size", "30px")
                       .style("font-family", "KaiTi", "STKaiti", "楷体", "Kaiti SC")
                       .text(category);
      });

    });
  }