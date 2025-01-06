function initializeMapPage(geoDataUrl, quantityDataUrl, libraryDataUrl) {
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
