# Memento-AI-Skill (数字镜像)

## 项目愿景 (Global Vision)
在漫长的岁月里，总有一些声音我们渴望再次听见，总有一些关怀我们希望永远停留。

**Memento-AI-Skill** 是一个开源的轻量级工具，旨在通过大语言模型（LLM）技术，从过往的聊天记录中“蒸馏”出已故亲人的性格特征、说话习惯和核心价值观。

**Memento 3.0 全球化开源愿景：**
悲伤与爱是全人类共通的语言。本项目不仅支持中文，更引入了**“文化语义包 (Cultural Schema Packs)”**。通过社区驱动的模板引擎，无论你来自东亚、北美还是拉丁美洲，系统都能根据特定的文化背景（如历史记忆、家庭价值观、表达爱意的方式）辅助你构建最真实的数字镜像。

科技的终极意义，在于赋予岁月以温度。

---

## 功能特性
- **多源数据蒸馏**: 自动分析聊天记录，提取人物画像（口头禅、性格、价值观）。
- **Schema 驱动的冷启动**: 内置 `templates/` 文化语义包，利用 AI 辅助填充不同文化背景下的记忆锚点。
- **人格生成**: 自动生成高度还原的第一人称 System Prompt，并统一输出为标准化的 `.skill` 协议。
- **沉浸式对话**: 提供极简的 CLI 交互界面，支持拟真打字延迟、流式输出与历史会话恢复 (Session Resume)。
- **心理安全防线**: 严格的防幻觉机制、未知事物降级法则，以及 UI 层的防沉迷与情绪逃生舱设计。

---

## 仓库结构 (Repository Structure)
```text
/
├── 1_distill.py           # 人格蒸馏核心算法 (支持 -t 传入文化模板)
├── 2_chat_cli.py          # 交互对话引擎 (支持历史记录恢复)
├── templates/             # 文化语义包 (Cultural Schema Packs)
│   ├── universal.json     # 人类普适维度
│   ├── zh-CN/             # 中文文化包
│   └── en-US/             # 英文文化包
├── docs/                  # 文档
│   └── i18n_contribution_guide.md # 国际化贡献指南
├── output/                # 生成的数字镜像配置与历史记录
└── data/                  # 原始聊天语料
```

---

## 快速上手 (Quick Start)

### 1. 环境准备
确保你的系统已安装 Python 3.8+。
克隆本项目后，安装依赖：
```bash
pip install -r requirements.txt
```

### 2. 配置 API Key
复制 `.env.example` 文件并重命名为 `.env`，填入你的 Google Gemini API Key：
```env
GEMINI_API_KEY="your_api_key_here"
# 可选：配置使用的模型
DISTILL_MODEL="gemini-3.1-pro-preview"
CHAT_MODEL="gemini-3-flash-preview"
```

### 3. 提取人物特征 (蒸馏)
运行蒸馏脚本，你可以通过 `-t` 参数指定文化模板来辅助 AI 理解语境：
```bash
# 基础用法
python 1_distill.py -i data/sample_chat.txt -n mom

# 使用特定的文化模板进行深度蒸馏
python 1_distill.py -i data/sample_chat.txt -n mom -t templates/zh-CN/elders.json
```

### 4. 开始对话
运行对话脚本，与“数字镜像”进行交流。系统会自动保存聊天记录，下次运行可无缝恢复：
```bash
python 2_chat_cli.py
```

---

## 参与贡献 (Contributing)
我们欢迎全球开发者为本项目贡献新的**文化语义包**！请查阅 `docs/i18n_contribution_guide.md` 了解如何提交 PR。

## 注意事项
- 本项目仅供个人缅怀与情感慰藉使用，请妥善保护您的隐私数据。
- 聊天记录越丰富，提取的人格越真实。
