let globalData = null;
let rawGeoData = null;
let selectedCategories = [];
let flag = true;
let minValue = 0;
let maxValue = 5;

const bookTitles = [
  "史记",
  "汉书",
  "后汉书",
  "三国志",
  "晋书",
  "宋书",
  "南齐书",
  "梁书",
  "陈书",
  "魏书",
  "北齐书",
  "周书",
  "隋书",
  "南史",
  "北史",
  "旧唐书",
  "新唐书",
  "旧五代史",
  "新五代史",
  "宋史",
  "辽史",
  "金史",
  "元史",
  "明史"
];

function loadData() {
    d3.json("assets/data_all.json").then(function(data) {
        globalData = data;
    }).catch(function(error) {
        console.error("加载数据失败:", error);
    });
    d3.json("assets/map_data.json").then(function(data) {
        rawGeoData = data;
    }).catch(function(error) {
        console.error("加载数据失败:", error);
    });
}

function convertToGeoJSON(rawData) {
    return {
      "type": "FeatureCollection",
      "features": rawData.map(item => ({
        "type": "Feature",
        "properties": {
          "name": item.Name
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": item.Geometry // 假设 Geometry 是一个有效的多边形数组
        }
      }))
    };
  }

function countByProvince(filteredData) {
  const provinceCounts = {}; // 存储各省份的古籍数量

  // 遍历筛选后的数据
  Object.values(filteredData).forEach(books => {
    books.forEach(book => {
      const province = book.publication_location; // 获取馆藏省份
      if (province) {
        // 如果省份存在，更新计数
        if (provinceCounts[province]) {
          provinceCounts[province]++;
        } else {
          provinceCounts[province] = 1;
        }
      }
    });
  });

  return provinceCounts;
}

// 统计各省份的古籍数量和书籍名称
function countByTitle(filteredData) {
  const provinceData = {}; // 存储各省份的古籍数量和书籍名称

  // 遍历筛选后的数据
  Object.values(filteredData).forEach(books => {
    books.forEach(book => {
      const province = book.publication_location; // 获取馆藏省份
      if (province) {
        // 如果省份存在，更新数据
        if (!provinceData[province]) {
          // 如果省份尚未记录，初始化数据结构
          provinceData[province] = {
            count: 0,
            books: [],
          };
        }
        // 更新计数和书籍名称列表
        provinceData[province].count++;
        provinceData[province].books.push(book.title+'（'+book.ancient_version+'）'); // 假设书籍名称存储在 title 字段
      }
    });
  });

  return provinceData;
}

loadData();

// 过滤数据的函数（支持多类别）
function filterDataByCategories(data, selectedCategories) {
  if (selectedCategories.length === 0 || selectedCategories.includes("all")) {
    // 如果未选择任何类别或选择了 "全部"，返回所有数据
        flag = true;
        return data;
    } else {
    // 否则返回选中类别的数据
        flag = false;
        const filteredData = {};
        selectedCategories.forEach(category => {
            if (data[category]) {
                filteredData[category] = data[category];
            }
        });
    // console.log('filteredData:', filteredData);
        return filteredData;
    }
}

function filterDataByDynasty(data, minDynasty, maxDynasty) {
  const filteredData = {};

  Object.entries(data).forEach(([category, books]) => {
    filteredData[category] = books.filter(book => {
      const dynasty = book.publication_time;
      return map_dynasty(dynasty) >= minDynasty && map_dynasty(dynasty) <= maxDynasty;
    });
  });

  return filteredData;
}


let isTooltipVisible = false;  // 新增标志，判断tooltip是否显示

function draw(geoData, data, selectedCategories, minDynasty, maxDynasty) {
  const NewData = filterDataByDynasty(data, minDynasty, maxDynasty);
  const filteredData = filterDataByCategories(NewData, selectedCategories);
  const provinceCounts = countByProvince(filteredData);
  const quantityMap = new Map(Object.entries(provinceCounts));

  // 计算数量的最大值，忽略 0
  const quantities = Array.from(quantityMap.values()).map(Number).filter(q => q > 0);
  const maxQuantity = d3.max(quantities) || 1; // 确保 maxQuantity 至少为 1

  // 地图宽高
  const width = window.innerWidth;
  const height = window.innerHeight;

  d3.select("#map").html("");

  // 设置SVG画布
  const svg = d3.select("#map")
    .attr("width", width)
    .attr("height", height);

  // 创建一个地理投影，适应于屏幕尺寸
  const projection = d3.geoMercator()
    .fitSize([width, height], geoData);

  // 创建路径生成器
  const path = d3.geoPath().projection(projection);

  // 创建对数比例尺，基于数量数据
  const color = d3.scaleSequential()
    .domain([1, maxQuantity]) // 对数比例尺的域从 1 到最大值
    .interpolator(d3.interpolateOrRd);

  // 定义颜色用于数量为 0 的省份
  const zeroColor = "#CCC"; // 灰色

  // 绘制地图
  svg.selectAll("path")
    .data(geoData.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", function(d) {
      // 获取省份名称
      const provinceName = d.properties.name;
      // 获取对应省份的数量
      const quantity = +quantityMap.get(provinceName) || 0;
      // 根据数量设置填充颜色
      return quantity > 0 ? color(quantity) : zeroColor;
    })
    .attr("stroke", "black")
    .attr("stroke-width", 0.5);

  const libraryMap = countByTitle(filteredData);

  // 获取 tooltip 元素
  const tooltip = d3.select("#tooltip")
    .style("pointer-events", "auto");

  // 监听 wheel 事件
  tooltip.on("wheel", function(event) {
    //event.preventDefault(); // 阻止默认的页面滚动行为
    const delta = event.deltaY || event.detail || event.wheelDelta; // 获取滚轮滚动的方向
    this.scrollTop += delta; // 调整工具提示内容的滚动位置
  }, { passive: false });

  // 添加交互性：鼠标悬停显示名称和数量
  svg.selectAll("path")
    .on("mouseover", function(event, d) {
      if (!isTooltipVisible) {
        // 只有在tooltip没有显示的情况下才响应mouseover
        d3.select(this).attr("fill", "blue");

        const provinceName = d.properties.name;

        // 从 result 中获取该省份的数据
        const provinceData = libraryMap[provinceName] || { count: 0, books: [] };

        // 构建书籍列表
        const bookList = provinceData.books.join('<br>');

        // 显示并设置 tooltip 内容和位置
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px")
          .style("opacity", 1)
          .html(`
            <strong>${provinceName}</strong><br>
            数量: ${provinceData.count}<br><br>
            <strong>书籍列表:</strong><br>
            ${bookList}
          `)
          .node().scrollTop = 0;
      }
    })
    .on("mousemove", function(event) {
      if (!isTooltipVisible) {
        // 只有在tooltip没有显示的情况下才响应mousemove，避免影响点击事件
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px");
      }
    })
    .on("mouseout", function(event, d) {
      if (!isTooltipVisible) {
        // 只有在tooltip没有显示的情况下才响应mouseout
        const provinceName = d.properties.name;
        const quantity = +quantityMap.get(provinceName) || 0;
        d3.select(this).attr("fill", quantity > 0 ? color(quantity) : zeroColor);

        // 隐藏 tooltip
        tooltip.style("opacity", 0);
      }
    })
    .on("click", function(event, d) {
      const provinceName = d.properties.name;

      if (isTooltipVisible) {
        // 如果tooltip已经显示，点击时隐藏
        tooltip.style("opacity", 0);
        isTooltipVisible = false; // 标记为隐藏状态
      } else {
        // 如果tooltip没有显示，点击时显示
        const provinceData = libraryMap[provinceName] || { count: 0, books: [] };
        const bookList = provinceData.books.join('<br>');

        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px")
          .style("opacity", 1)
          .html(`
            <strong>${provinceName}</strong><br>
            数量: ${provinceData.count}<br><br>
            <strong>书籍列表:</strong><br>
            ${bookList}
          `)
          .node().scrollTop = 0;

        isTooltipVisible = true; // 标记为显示状态
      }
    });

  // 窗口大小调整时更新地图尺寸
  window.addEventListener("resize", () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    svg
      .attr("width", newWidth)
      .attr("height", newHeight);

    projection.fitSize([newWidth, newHeight], geoData);
    svg.selectAll("path").attr("d", path);
  });
}


function map_dynasty(dynasty) {
  if (dynasty == "宋") {
    return 0;
  } else if (dynasty == "元") {
    return 1;
  } else if (dynasty == "明") {
    return 2;
  } else if (dynasty == "清") {
    return 3;
  } else if (dynasty == "民国") {
    return 4;
  }else if (dynasty == "现代") {
    return 5;
  } else {
    return -1;
  }
}


function initializeMapMainPage() {
  const data = globalData;
  const geoData = convertToGeoJSON(rawGeoData);


  const buttons = document.querySelectorAll('.image-button');
  buttons.forEach(button => {
    button.classList.add('initial'); // 初始状态为选中
  });

  // 获取滑块元素
  const minSlider = document.getElementById('min-slider');
  const maxSlider = document.getElementById('max-slider');
  minValue = minSlider.value;
  maxValue = maxSlider.value;

  draw(geoData, data, selectedCategories, minValue, maxValue);

  // const buttons = document.querySelectorAll('.image-button');

  // 监听 min-slider 的变化
  minSlider.addEventListener('input', function () {
      // 获取当前值
      minValue = minSlider.value;
      // 可以在这里添加其他逻辑
      draw(geoData, data, selectedCategories, minValue, maxValue);
  });

  // 监听 max-slider 的变化
  maxSlider.addEventListener('input', function () {
      // 获取当前值
      maxValue = maxSlider.value;
      draw(geoData, data, selectedCategories, minValue, maxValue);
  });

  // 为每个按钮绑定点击事件
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const category = bookTitles[Number(button.getAttribute('data-id')) - 1]; // 获取按钮的类别

      // 切换按钮的选中状态
      button.classList.toggle('active');

      // 更新选中的类别
      if (button.classList.contains('active')) {
        selectedCategories.push(category); // 添加类别
      } else {
        const index = selectedCategories.indexOf(category);
        if (index > -1) {
          selectedCategories.splice(index, 1); // 移除类别
        }
      }

      console.log('当前选中的类别:', selectedCategories);

      draw(geoData, data, selectedCategories, minValue, maxValue);

      if (flag) { // 如果是第一次点击
        buttons.forEach(button => {
          button.classList.add('initial');
        });
      } else {
        buttons.forEach(button => {
          button.classList.remove('initial');
        });
      }
    });
  });
}