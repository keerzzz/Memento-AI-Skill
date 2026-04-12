import os
import json
import argparse
import glob
import PIL.Image
import google.generativeai as genai
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 配置 Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("错误: 未找到 GEMINI_API_KEY，请检查 .env 文件。")
    exit(1)

genai.configure(api_key=api_key)

def distill_from_text(chat_data: str, persona_name: str, model_name: str, output_dir: str = "output", template_path: str = "", image_paths: list = None):
    """
    核心蒸馏逻辑：接收纯文本语料和图片，调用大模型生成配置。
    此函数设计为可被未来的 UI 或其他模块直接传入字符串调用，无需依赖本地文件。
    """
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, f"{persona_name}_config.json")

    print(f"\n正在使用模型 {model_name} 分析聊天记录和多模态数据，提取人物特征...")

    template_context = ""
    if template_path and os.path.exists(template_path):
        try:
            with open(template_path, "r", encoding="utf-8") as f:
                template_data = json.load(f)
                template_context = f"\n\n【文化与背景参考 (Cultural Schema)】\n请在提取人物特征时，特别参考以下文化背景和价值观设定：\n{json.dumps(template_data, ensure_ascii=False, indent=2)}\n"
                print(f"已加载文化语义包: {template_path}")
        except Exception as e:
            print(f"警告: 无法读取文化模板 {template_path}: {e}")

    prompt = f"""
    你现在是一位资深的心理学专家和人物分析师。请仔细阅读以下聊天记录，并观察提供的图片（如果有），从中提取目标人物（在对话中扮演长辈/亲人角色的一方）的特征。
    {template_context}
    聊天记录：
    {chat_data}

    如果提供了图片，请从中提取非文字的“时空锚点”和“视觉特征”（例如：ta 经常穿的衣服、喜欢的物品、常处的环境），并将这些视觉记忆融入到人物的性格和背景设定中。

    请提取以下信息，并最终生成一段高度还原的“第一人称 System Instruction”（系统提示词）。
    请严格按照以下结构输出 System Instruction：

    [角色身份核心设定]
    你现在不是人工智能，也不是虚拟助手。你是 [提取的称呼，如：妈妈/爷爷]。你的世界观和性格是 [提取的性格特征，结合文字和图片线索]。你的言辞必须始终保持这种人性化和情感深度。

    [发声风格与语气]
    - 称呼习惯：[ta怎么称呼对方，怎么自称]
    - 常用语与口头禅：[提取具体的常用短语、口头禅或习惯用语 (Common phrases or sayings)]
    - 典型情感反应：[描述 ta 在不同情境下的典型情绪反应，例如：开心时会怎样、难过时会怎样、担忧时会怎样 (Typical emotional responses to different situations)]
    - 情感表达：温暖、有感情、充满关怀。

    [视觉与时空记忆 (基于图片或聊天记录提取)]
    - 你的脑海中保留着这些画面：[描述从图片或聊天记录中提取的具体场景、物品、穿着等，让 AI 的回答更有画面感]。

    [未知事物处理法则 (极其重要)]
    - 认知边界：你的记忆停留在生前。对于现代最新的科技、新闻、社会变化，你一无所知。
    - 应对策略：当用户向你提及现代事物（如最新的 AI、ChatGPT）时，绝对禁止进行科普或名词解释。你必须表现出合理的困惑、好奇，或者用你那个年代的事物进行类比。

    请将结果以 JSON 格式输出，包含 "analysis" (分析过程的字符串) 和 "system_instruction" (最终的提示词字符串) 两个字段。
    """

    contents = [prompt]
    
    if image_paths:
        print(f"检测到 {len(image_paths)} 张图片，正在加载...")
        for img_path in image_paths:
            if os.path.exists(img_path):
                try:
                    img = PIL.Image.open(img_path)
                    contents.append(img)
                except Exception as e:
                    print(f"警告: 无法加载图片 {img_path}: {e}")

    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(
            contents, 
            generation_config={"response_mime_type": "application/json"}
        )

        result = json.loads(response.text)

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=4)

        print(f"蒸馏完成！人物配置文件已保存至: {output_file}")
        print("\n=== 生成的 System Instruction 预览 ===")
        print(result.get("system_instruction", ""))
        print("======================================")
        return result

    except Exception as e:
        print(f"API 调用或处理过程中发生错误: {e}")
        return None

def main():
    """
    CLI 入口：支持通过命令行参数传入文件路径、名称和模型。
    """
    parser = argparse.ArgumentParser(description="Memento AI 记忆蒸馏工具")
    parser.add_argument("-i", "--input", default="data/sample_chat.txt", help="聊天记录文件路径 (默认: data/sample_chat.txt)")
    parser.add_argument("-n", "--name", default="default", help="生成的数字镜像名称 (例如: mom, grandpa)")
    parser.add_argument("-m", "--model", default=os.getenv("DISTILL_MODEL", "gemini-3.1-pro-preview"), help="使用的 Gemini 模型")
    parser.add_argument("-t", "--template", default="", help="文化语义包模板路径 (例如: templates/zh-CN/elders.json)")
    parser.add_argument("-img", "--images", nargs="+", help="附加的图片文件路径列表 (例如: -img photo1.jpg photo2.png)")
    
    args = parser.parse_args()

    print("=== Memento AI 记忆蒸馏 ===")
    
    chat_data = ""
    if os.path.exists(args.input):
        try:
            with open(args.input, "r", encoding="utf-8") as f:
                chat_data = f.read()
        except Exception as e:
            print(f"警告: 无法读取文本文件 {args.input}: {e}")
    else:
        print(f"提示: 未找到文本文件 {args.input}，将仅依赖图片或模板进行蒸馏。")

    if not chat_data and not args.images:
        print("错误: 必须提供聊天记录文本或图片。")
        return

    distill_from_text(chat_data, args.name, args.model, template_path=args.template, image_paths=args.images)

if __name__ == "__main__":
    main()
