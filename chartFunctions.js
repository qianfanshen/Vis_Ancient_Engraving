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





let initialPositions = {}; // 保存 v2 的初始位置
let targetPositions = {}; // 保存 v1 的目标位置
let tooltip; // 全局变量
let customColors = [
        "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
        "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
        "#aec7e8", "#ffbb78", "#98df8a", "#ff9896", "#c5b0d5",
        "#c49c94", "#f7b6d2", "#c7c7c7", "#dbdb8d", "#9edae5",
        "#393b79", "#637939", "#8c6d31", "#843c39"
    ];

function loadData() {
    d3.json("assets/data.json").then(function(data) {
        globalData = data;
    }).catch(function(error) {
        console.error("加载数据失败:", error);
    });
}

loadData();

function initializev2position(selectedCategory = "all") {
    const data = globalData;

    const filteredData = selectedCategory === "all"
            ? data
            : Object.keys(data).reduce((acc, key) => {
                acc[key] = data[key].filter(d => d.category === selectedCategory);
                return acc;
            }, {});

    const width = 1000; // 矩形区域宽度
    const height = 600; // 矩形区域高度
    const padding = 50;

    const scatterPoints = [];
    Object.keys(filteredData).forEach(bookName => {
        filteredData[bookName].forEach((d, index) => {
            const x = Math.random() * (width - padding * 2) + padding; // 初始化 x 位置
            const y = Math.random() * (height - padding * 2) + padding; // 初始化 y 位置
            const id = d.id || `${bookName}-${index}`; // 如果 d.id 不存在，生成一个唯一 ID
            scatterPoints.push({
                ...d,
                id, // 确保每个散点都有唯一的 ID
                bookName,
                x, // 使用变量 x
                y  // 使用变量 y
            });
            initialPositions[id] = { x, y }; // 保存初始位置
        });
    });
}

function initializev1position(selectedCategory = "all") {
    const data = globalData;

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

    // 清空目标位置
    targetPositions = {};

    // 创建虚拟节点数据
    const nodes = bookCounts.map(book => ({
        ...book,
        x: Math.random() * 1200, // 初始 x 位置
        y: Math.random() * 600,  // 初始 y 位置
    }));

    // 创建力导向图模拟
    const simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(50)) // 增加排斥力
        .force("center", d3.forceCenter(600, 300)) // 中心力
        .force("collision", d3.forceCollide().radius(d => d.radius + 5)) // 碰撞检测
        .force("x", d3.forceX(600).strength(0.2)) // X 轴约束
        .force("y", d3.forceY(300).strength(0.2)) // Y 轴约束
        .on("tick", ticked);

    // 更新节点位置
    function ticked() {
        // 限制节点在画布范围内
        nodes.forEach(d => {
            d.x = Math.max(d.radius, Math.min(1200 - d.radius, d.x));
            d.y = Math.max(d.radius, Math.min(500 - d.radius, d.y));
        });

        // 在模拟完成后生成散点坐标
        if (simulation.alpha() < 0.001) { // 模拟接近完成
            nodes.forEach(book => {
                filteredData[book.name].forEach((d, j) => {
                    const id = d.id || `${book.name}-${j}`; // 如果 d.id 不存在，生成一个唯一 ID
                    // 基于圆圈的中心位置和半径随机生成散点坐标
                    const x = book.x + (Math.random() - 0.5) * book.radius * 1.5;
                    const y = book.y + (Math.random() - 0.5) * book.radius * 1.5;
                    targetPositions[id] = { x, y }; // 保存目标位置
                });
            });
            simulation.stop(); // 停止模拟
            console.log("Simulation complete. Target positions saved:", targetPositions);
        }
    }
}

function switchToV1() {
    console.log("Switching to v1...");
    const data = globalData;

    // 设置画布尺寸
    const width = 1200; // 矩形区域宽度
    const height = 600; // 矩形区域高度
    const padding = 50;

    // 过滤数据（如果需要）
    const filteredData = "all" === "all"
        ? data
        : Object.keys(data).reduce((acc, key) => {
            acc[key] = data[key].filter(d => d.category === "all");
            return acc;
        }, {});

    // 计算每部史书的古籍数量
    const bookCounts = Object.keys(filteredData).map(key => ({
        name: key,
        count: filteredData[key].length,
        radius: Math.sqrt(filteredData[key].length) * 10 // 区域大小与古籍数量成正比
    }));

    // 创建 SVG 画布
    const svg = d3.select("#chart").select("svg");

    // 清空之前的圆形区域和文本
    svg.selectAll(".node").remove();

    // 确保 tooltip 已定义
    if (!tooltip) {
        tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("display", "none"); // 初始隐藏
    }

    // 计算每个圆形区域的中心位置
    const nodePositions = {};
    Object.keys(filteredData).forEach(bookName => {
        const points = filteredData[bookName].map(d => {
            const id = d.id || `${bookName}-${filteredData[bookName].indexOf(d)}`;
            return targetPositions[id];
        });

        // 计算圆形区域的中心位置
        const centerX = d3.mean(points, p => p.x);
        const centerY = d3.mean(points, p => p.y);

        // 计算圆形区域的半径（确保所有散点都在圆形区域内）
        const radius = d3.max(points, p => Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2)) + 10; // 加 10 作为边距

        nodePositions[bookName] = { x: centerX, y: centerY, radius };
    });

    // 绘制圆形区域
    const nodes = svg.selectAll(".node")
        .data(bookCounts)
        .enter()
        .append("g")
        .attr("class", "node")
        .style("opacity", 0)
        .attr("data-name", d => d.name); // 添加数据绑定属性

    nodes.transition() // 开始过渡
        .duration(2000) // 过渡时间为 2 秒
        .style("opacity", 1); // 淡入到完全可见

    // 绘制圆形区域
    nodes.append("circle")
        .attr("r", d => nodePositions[d.name].radius) // 使用计算的半径
        .attr("cx", d => nodePositions[d.name].x) // 使用计算的中心 x 坐标
        .attr("cy", d => nodePositions[d.name].y) // 使用计算的中心 y 坐标
        .attr("fill", "transparent") // 背景透明
        .attr("stroke", "black") // 保留边框
        .attr("opacity", 1);

    // 绘制史书名称
    nodes.append("text")
        .attr("class", "book-name")
        .attr("x", d => nodePositions[d.name].x) // 文本的 x 坐标与圆形区域中心一致
        .attr("y", d => nodePositions[d.name].y) // 文本的 y 坐标与圆形区域中心一致
        .attr("text-anchor", "middle") // 文本水平居中
        .attr("dominant-baseline", "middle") // 文本垂直居中
        .text(d => d.name) // 显示史书名字
        // .style("font-size", "12px")
        // .style("fill", "black");

    // 获取所有散点
    const scatter = svg.selectAll(".scatter")

    // 将散点移动到 targetPositions 中的位置
    scatter.transition()
        .duration(1000) // 过渡持续时间为 1000 毫秒
        .ease(d3.easeCubic) // 使用缓动函数
        .attr("cx", d => targetPositions[d.id].x) // 使用 targetPositions 中的 x 坐标
        .attr("cy", d => targetPositions[d.id].y) // 使用 targetPositions 中的 y 坐标
        .attr("pointer-events", "all")
        .attr("r", 4) // 设置散点大小

    scatter
    .on("mouseover", function (event, d) {
        console.log("Mouseover event triggered:", event, d); // 打印事件对象和数据
        tooltip
            .style("display", "block")
            .html(
                `<strong>${d.title}</strong><br>
                类别: ${d.category || "未知"}<br>
                版本类型: ${d.version_type || "未知"}<br>
                刊刻时间: ${d.publication_time || "未知"}<br>
                刊刻地点: ${d.publication_location || "未知"}<br>
                四部分类: ${d.four_part_classification || "未知"}<br>
                馆藏省份: ${d.library_province || "未知"}`
            )
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
    })
    .on("mouseout", function (event, d) {
        console.log("Mouseout event triggered:", event, d); // 打印事件对象和数据
        tooltip.style("display", "none");
    });

    nodes.select("circle")
    .attr("pointer-events", "none");

    // 确保散点的 pointer-events 为 all
    scatter.attr("pointer-events", "all");

    // 图例淡出
    d3.select("#legend")
        .transition()
        .duration(1000)
        .style("opacity", 0)
        .style("pointer-events", "none");
        // .remove();

    // d3.select("#legend").selectAll("*").remove();
}

function switchToV2() {
    console.log("Switching to v2...");
    const data = globalData;

    // 设置画布尺寸
    const width = 1000; // 矩形区域宽度
    const height = 600; // 矩形区域高度
    const padding = 50;

    // 颜色比例尺
    const colorScale = d3.scaleOrdinal(customColors);

    // 清空之前的 SVG
    // d3.select("#chart").html("");
    // 创建 SVG 画布
    const svg = d3.select("#chart").select("svg");
    // svg.selectAll(".node").remove();

    // 淡出圆形区域
    svg.selectAll(".node")
        .transition() // 开始过渡
        .duration(1000) // 过渡时间为 1 秒
        .style("opacity", 0) // 淡出到完全透明
        .remove(); // 移除节点


    // 更新散点位置
    const scatter = svg.selectAll(".scatter")
    scatter.transition() // 开始过渡
    .duration(1000) // 过渡时间为 1 秒
    .attr("cx", d => {
        const position = initialPositions[d.id];
        if (position) {
            // console.log("Restoring initial x position:", position.x);
            return position.x; // 恢复初始 x 位置
        } else {
            // console.log("Randomizing x position...");
            return Math.random() * (width - padding * 2) + padding; // 如果没有初始位置，使用随机位置
        }
    })
    .attr("cy", d => {
        const position = initialPositions[d.id];
        if (position) {
            return position.y; // 恢复初始 y 位置
        } else {
            return Math.random() * (height - padding * 2) + padding; // 如果没有初始位置，使用随机位置
        }
    })
    .attr("r", 6) // 设置散点大小
    .attr("fill", d => colorScale(d.bookName)) // 设置散点颜色
    .attr("opacity", 0.7); // 设置透明度

    // 图例淡入
    d3.select("#legend")
        .transition()
        .duration(1000)
        .style("opacity", 1)
        .style("pointer-events", "all");
}

function drawChartPage3_v2(selectedCategory = "all") {
    console.log("Drawing v2...");

    const data = globalData;

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

    // 清空之前的 SVG
    d3.select("#chart").html("");

    // 创建 SVG 画布
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // 确保 tooltip 已定义
    if (!tooltip) {
        tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("display", "none"); // 初始隐藏
    }

    const colorScale = d3.scaleOrdinal(customColors);

    const scatterPoints = [];
    Object.keys(filteredData).forEach(bookName => {
        filteredData[bookName].forEach((d, index) => {
            const id = d.id || `${bookName}-${index}`; // 如果 d.id 不存在，生成一个唯一 ID
            // 从 initialPositions 中加载保存的坐标
            const savedPosition = initialPositions[id];
            const x = savedPosition ? savedPosition.x : Math.random() * (width - padding * 2) + padding; // 使用保存的 x 或随机生成
            const y = savedPosition ? savedPosition.y : Math.random() * (height - padding * 2) + padding; // 使用保存的 y 或随机生成
            scatterPoints.push({
                ...d,
                id, // 确保每个散点都有唯一的 ID
                bookName,
                x, // 使用变量 x
                y  // 使用变量 y
            });
            // 如果 initialPositions 中没有保存的坐标，则保存当前坐标
            if (!savedPosition) {
                initialPositions[id] = { x, y };
            }
        });
    });

    // 绘制散点
    const scatter = svg.selectAll(".scatter")
        .data(scatterPoints)
        .enter()
        .append("circle")
        .attr("class", "scatter")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 6)
        .attr("fill", d => colorScale(d.bookName))
        .attr("opacity", 0)
        .on("mouseover", function (event, d) {
            // 显示工具提示
            tooltip
                .style("display", "block")
                .html(
                    `<strong>${d.title}</strong><br>
                    类别: ${d.category || "未知"}<br>
                    版本类型: ${d.version_type || "未知"}<br>
                    刊刻时间: ${d.publication_time || "未知"}<br>
                    刊刻地点: ${d.publication_location || "未知"}<br>
                    四部分类: ${d.four_part_classification || "未知"}<br>
                    馆藏省份: ${d.library_province || "未知"}`
                )
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function () {
            // 隐藏工具提示
            tooltip.style("display", "none");
        });

    scatter.transition()
        .duration(2000)
        .attr("opacity", 0.7); // 最终透明度为 0.7

    // 保存当前散点的引用
    currentScatter = scatter;

    // 添加图例
    const legend = d3.select("#legend").html(""); // 清空图例容器

    const legendItems = legend.selectAll(".legend-item")
        .data(bookCounts)
        .enter()
        .append("div")
        .attr("class", "legend-item")
        .attr("font-size", "8px")
        .attr("data-name", d => d.name)
        .style("opacity", 0)
        .html(d => `
            <div style="display: inline-block; width: 15px; height: 15px; background-color: ${colorScale(d.name)};"></div>
            <span>${d.name}</span>
        `)
        .on("click", function (event, d) {
            const isSelected = d3.select(this).classed("selected");

            // 如果当前图例项未选中，则选中它
            if (!isSelected) {
                // 取消所有图例项的选中状态
                d3.selectAll(".legend-item").classed("selected", false);
                d3.select(this).classed("selected", true);

                // 更新散点颜色
                scatter
                    .attr("fill", scatterPoint => {
                        return scatterPoint.bookName === d.name
                            ? colorScale(scatterPoint.bookName)
                            : "#ccc";
                    })
                    .attr("opacity", scatterPoint => {
                        return scatterPoint.bookName === d.name
                            ? 0.7
                            : 0.3;
                    });
            } else {
                // 如果当前图例项已选中，则取消选中
                d3.select(this).classed("selected", false);

                // 更新散点颜色
                scatter
                    .attr("fill", scatterPoint => {
                        return colorScale(scatterPoint.bookName);
                    })
                    .attr("opacity", 0.7);
            }
        });

    // 图例淡入效果
    legendItems.transition()
        .duration(2000) // 过渡时间为 1 秒
        .style("opacity", 1); // 最终透明度为 1

    // 打印生成的图例项
    console.log("Legend items:", legend.selectAll(".legend-item").nodes());

    const legendHeight = legendItems.nodes().reduce((sum, item) => sum + item.offsetHeight, 0);
    legend.style("height", `${legendHeight / 2 + 120}px`); // 设置图例容器高度

    console.log(`Legend height set: ${legendHeight / 2 + 20}px`);
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
