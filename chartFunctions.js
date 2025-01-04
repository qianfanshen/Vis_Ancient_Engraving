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
  function initializeChartPage3() {
    // TODO
  }
  