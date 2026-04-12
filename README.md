````markdown
# Memento-AI-Skill (数字镜像)

```text
=================================================
  __  __                               _        
 |  \/  | ___ _ __ ___   ___ _ __ | |_ ___  
 | |\/| |/ _ \ '_ ` _ \ / _ \ '_ \| __/ _ \ 
 | |  | |  __/ | | | | |  __/ | | | || (_) |
 |_|  |_|\___|_| |_| |_|\___|_| |_|\__\___/  
                                            
       A I - S K I L L   D I S T I L L E R
=================================================
"Distilling Memories, Reconnecting Souls."
````

## 🕯️ 项目愿景 (Global Vision)

在漫长的岁月里，总有一些声音我们渴望再次听见，总有一些关怀我们希望永远停留。

**Memento-AI-Skill** 是一个开源的轻量级工具，旨在通过大语言模型（LLM）技术，从过往的聊天记录中“蒸馏”出已故亲人的性格特征、说话习惯和核心记忆，生成一个专属的数字镜像陪伴生者。

悲伤与爱是全人类共通的语言。本项目引入了\*\*“双层记忆架构 (Persona + Memory Layer)”**与**“文化语义包 (Cultural Schema Packs)”\*\*，无论你来自哪种文化背景，都能构建出最符合本土语境、最具温度的数字纪念碑。

-----

## ✨ 核心特性 (Features)

  - **多模态数据蒸馏**: 支持分析纯文本聊天记录（微信/WhatsApp等）与老照片，全方位提取人物画像。
  - **双层分离架构 (Core)**: 对齐业界先进标准，将底层数据拆分为 `Persona (人格层)` 和 `Memory (记忆层)`。这种设计允许未来引入 `Correction (实时纠偏层)`，确保对话逻辑不会因大模型幻觉而崩塌。
  - **Prompt 控制权反转**: 独家支持 `-p` 参数。用户可以完全自定义“蒸馏指令”，选择使用系统预设的心理学专家模板，或加载自己编写的私有 Prompt。
  - **国际化与文化包**: 提供多语言支持，内置 `zh-CN`、`en-US` 等文化语义模板，解决不同文化背景下“长辈”或“朋友”角色的冷启动问题。
  - **AgentSkills 标准导出**: 自动生成符合业界标准的 `.skill.json`，可无缝挂载至 Claude Code、GitHub Copilot 或其他 LLM Agent 框架。
  - **治愈系 Web UI**: 附带基于 React + TailwindCSS 的交互界面，包含**防沉迷提醒**与**情绪安全逃生舱**，将技术安全与心理健康置于首位。

-----

## 🚀 快速上手 (Quick Start)

### 1\. 环境准备

克隆本项目后，安装必要的 Python 依赖：

```bash
git clone [https://github.com/keerzzz/Memento-AI-Skill.git](https://github.com/keerzzz/Memento-AI-Skill.git)
cd Memento-AI-Skill
pip install -r requirements.txt
```

### 2\. 配置 API Key

复制 `.env.example` 文件并重命名为 `.env`，填入你的 Google Gemini API Key：

```env
GEMINI_API_KEY="你的_API_密钥"
DISTILL_MODEL="gemini-1.5-pro" # 推荐使用 Pro 以获得更好的多模态分析能力
```

### 3\. 提取人物特征 (蒸馏)

这是项目的核心步骤，将原始数据转化为 AI 可理解的“灵魂配置文件”：

```bash
# 基础用法：提取名为 mom 的人物特征
python 1_distill.py -i data/sample_chat.txt -n mom

# 【高级】使用自定义的 Prompt 模板进行极限蒸馏
python 1_distill.py -i data/sample_chat.txt -n mom -p data/my_custom_prompt.txt

# 【国际化】结合特定的文化语义包（如中国式长辈）进行蒸馏
python 1_distill.py -i data/sample_chat.txt -n mom -t templates/zh-CN/elders.json

# 【多模态】同时分析文本和亲人生前的照片
python 1_distill.py -i data/sample_chat.txt -n mom -img photo1.jpg photo2.png
```

### 4\. 开启对话

  - **命令行对话**: 运行 `python 2_chat_cli.py` 在终端直接与 TA 聊天。
  - **图形化界面**:
    ```bash
    npm install
    npm run dev
    ```
    启动 React 治愈系网页端，体验更具仪式感的交互。

-----

## 🛠️ 项目结构 (Project Structure)

  - `1_distill.py`: 核心脚本，负责读取原始数据并生成 `persona_config.json`。
  - `2_chat_cli.py`: 极简对话终端，加载配置文件开启 AI 互动。
  - `3_export_skill.py`: 适配器脚本，将配置导出为标准的 `AgentSkill` 格式。
  - `templates/`: 存放全球不同文化背景的初始化模板。
  - `src/`: 基于 Vite + React 的前端源代码，包含情绪疏导逻辑。

-----

## 🤝 参与贡献 (Contributing)

这是一个有温度、有情怀的开源实验。我们欢迎来自全球的贡献者：

  - **文化包贡献**: 提交你所在地区的独特文化模板（如 `es-ES` 模板）。
  - **解析器开发**: 帮助我们开发一键解析微信、Telegram 或 WhatsApp 导出格式的脚本。
  - **UI/UX 优化**: 提升网页端的视觉舒适度与交互温度。

> *“死者并不是真的死去，只要我们还记得他们。”*

-----

## ⚖️ 伦理与免责声明

1.  **隐私说明**: 本项目生成的数字镜像属于高度私密的个人数据，请勿将其上传至公开平台。
2.  **心理健康**: 本工具旨在提供心灵慰藉，无法替代专业的心理治疗。如您感到过度沉迷或情绪失控，请务必利用项目内置的“逃生舱”功能并寻求现实生活中的专业帮助。
3.  **数据用途**: 禁止将本项目用于任何形式的欺诈、商业牟利或未授权的他人肖像复刻。

-----

**License**: [MIT](https://www.google.com/search?q=LICENSE)

```
```
