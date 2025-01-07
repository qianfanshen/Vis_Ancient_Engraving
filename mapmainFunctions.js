let globalData = null;
let rawGeoData = null;
let selectedCategories = [];
let flag = true;

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
    d3.json("assets/data.json").then(function(data) {
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

// 统计各省份的古籍数量
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
    console.log('filteredData:', filteredData);
        return filteredData;
    }
}



function initializeMapMainPage() {
  const data = globalData;
  const geoData = convertToGeoJSON(rawGeoData);


  const buttons = document.querySelectorAll('.image-button');
  buttons.forEach(button => {
    button.classList.add('initial'); // 初始状态为选中
  });


  const filteredData = filterDataByCategories(data, selectedCategories);
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

  // const buttons = document.querySelectorAll('.image-button');

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

      // 过滤数据
      const filteredData = filterDataByCategories(data, selectedCategories);

      if (flag) { // 如果是第一次点击
        buttons.forEach(button => {
          button.classList.add('initial');
        });
      } else {
        buttons.forEach(button => {
          button.classList.remove('initial');
        });
      }

      const provinceCounts = countByProvince(filteredData);
      const quantityMap = new Map(Object.entries(provinceCounts));

      // 计算数量的最大值，忽略 0
      const quantities = Array.from(quantityMap.values()).map(Number).filter(q => q > 0);
      const maxQuantity = d3.max(quantities) || 1; // 确保 maxQuantity 至少为 1

      // 地图宽高
      const width = window.innerWidth;
      const height = window.innerHeight;

      // 设置SVG画布
      d3.select("#map").html("");
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
    });
  });
}


function OriinitializeMapMainPage(geoDataUrl, quantityDataUrl, libraryDataUrl) {
    // 使用 Fetch API 加载省份数量数据和图书馆数据
    Promise.all([fetch(geoDataUrl), fetch(quantityDataUrl), fetch(libraryDataUrl)])
      .then(([geoResponse, quantityResponse, libraryResponse]) =>
        Promise.all([geoResponse.json(), quantityResponse.json(), libraryResponse.json()])
      )
      .then(([rawGeoData, rawQuantityData, rawLibraryData]) => {
        // 将原始地理数据转换为 GeoJSON 格式
        const geoData = convertToGeoJSON(rawGeoData);

        // 创建一个 Map 来存储省份名称和数量的对应关系
        const quantityMap = new Map(Object.entries(rawQuantityData));

        // 创建一个 Map 来存储每个省份对应的图书馆及数量
        const libraryMap = new Map();
        for (const [libraryName, libraryInfo] of Object.entries(rawLibraryData)) {
          const { province, count } = libraryInfo;
          if (!libraryMap.has(province)) {
            libraryMap.set(province, []);
          }
          libraryMap.get(province).push({ libraryName, count });
        }

        // 计算数量的最大值，忽略 0
        const quantities = Array.from(quantityMap.values()).map(Number).filter(q => q > 0);
        const maxQuantity = d3.max(quantities) || 1; // 确保 maxQuantity 至少为 1

        // 地图宽高
        const width = window.innerWidth;
        const height = window.innerHeight;

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

        // 获取 tooltip 元素
        const tooltip = d3.select("#tooltip");

        // 添加交互性：鼠标悬停显示名称和数量
        svg.selectAll("path")
          .on("mouseover", function(event, d) {
            // 改变颜色
            d3.select(this).attr("fill", "orange");

            // 获取省份名称和数量
            const provinceName = d.properties.name;
            const quantity = +quantityMap.get(provinceName) || 0;

            // 获取该省份的所有图书馆及它们的数量
            const libraries = libraryMap.get(provinceName) || [];

            // 构建图书馆列表
            const libraryList = libraries.map(lib => `${lib.libraryName}: ${lib.count}`).join('<br>');

            // 显示并设置 tooltip 内容和位置
            tooltip
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY + 10) + "px")
              .style("opacity", 1)
              .html(`
                <strong>${provinceName}</strong><br>
                数量: ${quantity}<br><br>
                <strong>图书馆:</strong><br>
                ${libraryList}
              `);
          })
          .on("mousemove", function(event) {
            // 更新 tooltip 位置
            tooltip
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY + 10) + "px");
          })
          .on("mouseout", function(event, d) {
            // 恢复颜色
            const provinceName = d.properties.name;
            const quantity = +quantityMap.get(provinceName) || 0;
            d3.select(this).attr("fill", quantity > 0 ? color(quantity) : zeroColor);

            // 隐藏 tooltip
            tooltip.style("opacity", 0);
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
      })
      .catch(error => {
        console.error('加载 JSON 文件失败:', error);
      });
  }

  // 将原始数据转换为 GeoJSON 格式
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