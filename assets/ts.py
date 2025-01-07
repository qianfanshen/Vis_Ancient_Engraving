import json

# 加载 JSON 文件
with open('data_cleaned.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 提取所有 publication_time 的值
publication_times = set()

# 遍历 JSON 数据
for book, entries in data.items():
    for entry in entries:
        if 'publication_time' in entry and entry['publication_time'] is not None:
            time = entry['publication_time'].strip()  # 去除前后空格
            publication_times.add(time)

# 打印所有可能的 publication_time
print("所有可能的 publication_time 值：")
for time in publication_times:
    print(time)


# for book, entries in data.items():
#     for entry in entries:
#         if 'publication_time' in entry and entry['publication_time'] == "清/民国":
#             entry['publication_time'] = "清"

# # 保存修改后的数据到新文件
# with open('data_cleaned.json', 'w', encoding='utf-8') as f:
#     json.dump(data, f, ensure_ascii=False, indent=4)