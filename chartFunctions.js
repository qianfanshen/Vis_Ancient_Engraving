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







  function initializeChartPage3(selectedCategory = "all") {
    // 加载数据
    d3.json("assets/data.json").then(function(data) {
        // 过滤数据（如果需要）
        const filteredData = selectedCategory === "all"
            ? data
            : Object.keys(data).reduce((acc, key) => {
                acc[key] = data[key].filter(d => d.category === selectedCategory);
                return acc;
            }, {});

        // 计算每部史书的古籍数量
        const bookCounts = Object.keys(filteredData).map(key => ({
            name: key,
            count: filteredData[key].length,
            radius: Math.sqrt(filteredData[key].length) * 10 // 区域大小与古籍数量成正比
        }));

        // 设置画布尺寸
        const width = 1000; // 矩形区域宽度
        const height = 600; // 矩形区域高度
        const padding = 50;

        // 创建 SVG 画布
        const svg = d3.select("#chart")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        // 颜色比例尺
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        // 绘制圆形区域
        const nodes = svg.selectAll(".node")
            .data(bookCounts)
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("data-name", d => d.name); // 添加数据绑定属性

        nodes.append("circle")
            .attr("r", d => d.radius)
            .attr("fill", d => colorScale(d.name))
            .attr("stroke", "black")
            .attr("opacity", 1)
            .on("click", function(event, d) {
                // 切换选中状态
                const isSelected = d3.select(this).classed("selected");
                d3.select(this).classed("selected", !isSelected);

                // 更新图表状态
                updateChart();
            });

        nodes.append("text")
            .attr("class", "book-name")
            .attr("x", 0) // 文本水平居中
            .attr("y", 0) // 文本垂直居中
            .attr("text-anchor", "middle") // 文本水平居中
            .attr("dominant-baseline", "middle") // 文本垂直居中
            .text(d => d.name) // 显示史书名字
            // .style("font-size", "12px")
            // .style("fill", "black");

        // 绘制散点
        nodes.each(function(book) {
            const node = d3.select(this);
            filteredData[book.name].forEach((d, j) => {
                node.append("circle")
                    .attr("cx", (Math.random() - 0.5) * book.radius * 1.5)
                    .attr("cy", (Math.random() - 0.5) * book.radius * 1.5)
                    .attr("r", 3)
                    .attr("fill", "white")
                    .attr("class", "scatter")
                    .attr("data-name", book.name); // 添加数据绑定属性
            });
        });


        // 力导向图模拟
        const simulation = d3.forceSimulation(bookCounts)
            .force("charge", d3.forceManyBody().strength(10)) // 增加排斥力
            .force("center", d3.forceCenter(width / 2, height / 2)) // 中心力
            .force("collision", d3.forceCollide().radius(d => d.radius + 5)) // 碰撞检测
            .force("x", d3.forceX(width / 2).strength(0.1)) // X 轴约束
            .force("y", d3.forceY(height / 2).strength(0.1)) // Y 轴约束
            .on("tick", ticked);

        // 更新节点位置
        function ticked() {
            nodes.attr("transform", d => {
                // 限制节点在画布范围内
                const x = Math.max(d.radius, Math.min(width - d.radius, d.x));
                const y = Math.max(d.radius, Math.min(height - d.radius, d.y));
                return `translate(${x}, ${y})`;
            });
        }

        // 更新图表状态
        function updateChart() {
            console.log("Updating chart...");

            nodes.select("circle")
                .attr("fill", d => {
                    const legendItem = d3.select(`.legend-item[data-name='${d.name}']`);
                    const isSelected = legendItem.classed("selected");
                    console.log(`Node ${d.name}: selected = ${isSelected}`);
                    return isSelected ? colorScale(d.name) : "#ccc";
                })
                .attr("opacity", d => {
                    const legendItem = d3.select(`.legend-item[data-name='${d.name}']`);
                    const isSelected = legendItem.classed("selected");
                    return isSelected ? 1 : 0.5;
                });

            nodes.selectAll(".scatter")
                .attr("fill", d => {
                    const legendItem = d3.select(`.legend-item[data-name='${d.name}']`);
                    const isSelected = legendItem.classed("selected");
                    return isSelected ? "white" : "#999";
                });
        }

        // 添加图例
        const legend = d3.select("#legend");

        // 生成图例项
        legend.selectAll(".legend-item")
              .data(bookCounts)
              .enter()
              .append("div")
              .attr("class", "legend-item")
              .attr("data-name", d => d.name)
              .html(d => `
                  <div style="display: inline-block; width: 15px; height: 15px; background-color: ${colorScale(d.name)};"></div>
                  <span>${d.name}</span>
              `)
              .on("click", function(event, d) {
                  console.log(`Clicked on ${d.name}`);
                  const isSelected = d3.select(this).classed("selected");
                  d3.select(this).classed("selected", !isSelected);
                  updateChart();
              });

      // 打印生成的图例项
      console.log("Legend items:", legend.selectAll(".legend-item").nodes());


      const legendItems = legend.selectAll(".legend-item").nodes();
      const totalHeight = legendItems.reduce((sum, item) => sum + item.offsetHeight, 0);

      // 设置图例容器高度（两列高度为总高度的一半）
      legend.style("height", `${totalHeight / 2 + 100}px`); // 增加 20px 的 padding

      console.log(`Legend height set: ${totalHeight / 2 + 20}px`);


      const h1 = d3.select("h1");
      console.log("h1 text-align:", h1.style("text-align"));

        // 添加工具提示
        d3.select("body").append("div")
            .attr("class", "tooltip");
    }).catch(function(error) {
        console.error("加载数据失败:", error);
    });
}



// 页面 4 的折线图初始化函数
function initializeChartPageTypeDist() {
    d3.json("assets/data2.json").then(data => {

      const margin = { top: 50, right: 80, bottom: 50, left: 80 };
      const width = 800 - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;

      const svg = d3.select("svg")
                    .append("g")
                    .attr("transform", `translate(${margin.left},${margin.top})`);

      // 2. 定义 X 轴和 Y 轴
      const xScale = d3.scaleBand()
                      .domain(data.map(d => d.type))
                      .range([0, width])
                      .padding(0.1);  // 设置柱状图之间的间隙

      // 调整 yScale 的 domain，使得最小值稍微大于 0，确保0的柱可以显示
      const yScale = d3.scaleLinear()
                      .domain([-5, d3.max(data, d => Math.max(d["宋代"], d["元代"], d["明代"], d["清代"], d["民国"], d["现代"]))])  // 稍微扩大最大值
                      .range([height, 0]);

      // 3. 画 X 轴和 Y 轴
      svg.append("g")
         .attr("transform", `translate(0, ${height})`)
         .call(d3.axisBottom(xScale))
         .style("font-size", "24px")
         .style("font-family", "KaiTi");

      // 设定 y 轴，并使用百分号格式化
      const yAxis = d3.axisLeft(yScale)
                      .ticks(5)  // 设置刻度数
                      .tickFormat(d => `${d}%`); // 添加百分号

      svg.append("g")
         .call(yAxis)
         .style("font-size", "24px");

      // 4. 定义颜色
      const colors = {
        "宋代": "#8D4BBB",
        "元代": "#549688",
        "明代": "#FFA631",
        "清代": "#3DE1AD",
        "民国": "#177CB0",
        "现代": "#F20C00"
      };

      // 5. 画柱状图
      const categories = ["宋代", "元代", "明代", "清代", "民国", "现代"];
      const visibility = { "宋代": true, "元代": true, "明代": true, "清代": true, "民国": true, "现代": true };

      categories.forEach(category => {
        // 为每个类别创建一组柱状图
        svg.selectAll(`.bar.${category}`)
           .data(data)
           .enter()
           .append("rect")
           .attr("class", `bar ${category}`)
           .attr("x", d => xScale(d.type) + (categories.indexOf(category) * (xScale.bandwidth() / categories.length))) // 对每个类别的位置进行微调
           .attr("y", d => yScale(d[category]))
           .attr("width", xScale.bandwidth() / categories.length)  // 每个类别的柱宽
           .attr("height", d => height - yScale(d[category]))  // 高度根据数据变化
           .attr("fill", colors[category])
           .style("opacity", 0) // 初始时柱状图不可见
           .transition()
           .duration(1000)
           .delay((d, i) => i * 200) // 每个柱状图逐步显现
           .style("opacity", 1); // 过渡显示柱状图
      });

      // 6. 创建折线选择按钮（控制柱状图的显示和隐藏）
      const buttonContainer = svg.append("g")
                                 .attr("transform", `translate(0, ${height + 80})`);

      categories.forEach((category, i) => {
        buttonContainer.append("rect")
                       .attr("x", i * 100 + 30)
                       .attr("y", 0)
                       .attr("width", 80)
                       .attr("height", 50)
                       .attr("fill", colors[category])
                       .style("cursor", "pointer")
                       .on("click", function() {
                           visibility[category] = !visibility[category]; // 切换可见性
                           d3.selectAll(`.bar.${category}`).style("display", visibility[category] ? "block" : "none");
                       });

        buttonContainer.append("text")
                       .attr("x", i * 100 + 70)
                       .attr("y", 35)
                       .attr("text-anchor", "middle")
                       .attr("fill", "#fff")
                       .style("font-size", "24px")
                       .style("font-family", "KaiTi", "STKaiti", "楷体", "Kaiti SC")
                       .text(category);
      });

    });
  }
