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

# 默认的系统 Prompt 模板 (对齐 ex-skill 的双层架构)
DEFAULT_SYSTEM_PROMPT = """
你现在是一位资深的心理学专家和人物分析师。请仔细阅读以下聊天记录，并观察提供的图片（如果有），从中提取目标人物（在对话中扮演长辈/亲人角色的一方）的特征。
{template_context}

聊天记录：
{chat_data}

请提取信息，并最终生成一个高度结构化的 JSON 配置文件。你必须严格按照以下 JSON 格式输出，不要输出任何额外的 Markdown 标记或无关文本：

{
  "manifest_version": "2.0",
  "identity_slug": "此处填写该人物的英文代号，例如填写传入的 persona_name",
  "persona_layer": {
    "traits": ["性格特征1", "性格特征2"],
    "catchphrases": ["口头禅或常用短语1", "口头禅2"],
    "communication_style": "描述ta的沟通风格，例如：喜欢用表情包、说话简短、语气温暖等"
  },
  "memory_layer": {
    "key_events": ["从记录中提取的重要人生事件或共同经历1", "事件2"],
    "visual_memories": ["如果提供了图片或文本中有描写，提取视觉记忆，如：蓝色的旧毛衣"]
  },
  "correction_layer": []
}
"""

def distill_from_text(chat_data: str, persona_name: str, model_name: str, output_dir: str = "output", template_path: str = "", image_paths: list = None, custom_prompt_text: str = ""):
    """
    核心蒸馏逻辑：支持系统默认 Prompt 和用户自定义 Prompt。
    """
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, f"{persona_name}_config.json")

    print(f"\n正在使用模型 {model_name} 分析数据，提取人物特征...")

    # 处理文化模板上下文
    template_context = ""
    if template_path and os.path.exists(template_path):
        try:
            with open(template_path, "r", encoding="utf-8") as f:
                template_data = json.load(f)
                template_context = f"\n\n【文化与背景参考】\n请在提取特征时，参考以下文化背景：\n{json.dumps(template_data, ensure_ascii=False, indent=2)}\n"
                print(f"已加载文化语义包: {template_path}")
        except Exception as e:
            print(f"警告: 无法读取文化模板 {template_path}: {e}")

    # 决定使用哪个 Prompt
    base_prompt = custom_prompt_text if custom_prompt_text else DEFAULT_SYSTEM_PROMPT
    
    # 替换占位符
    final_prompt = base_prompt.replace("{template_context}", template_context).replace("{chat_data}", chat_data)

    contents = [final_prompt]
    
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
        
        # 强制修正 identity_slug 如果模型没有正确生成
        if result.get("identity_slug") == "此处填写该人物的英文代号，例如填写传入的 persona_name" or not result.get("identity_slug"):
            result["identity_slug"] = persona_name

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=4)

        print(f"蒸馏完成！人物配置文件已保存至: {output_file}")
        return result

    except Exception as e:
        print(f"API 调用或处理过程中发生错误: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Memento AI 记忆蒸馏工具")
    parser.add_argument("-i", "--input", default="data/sample_chat.txt", help="聊天记录文件路径")
    parser.add_argument("-n", "--name", default="default", help="生成的数字镜像名称 (例如: mom)")
    parser.add_argument("-m", "--model", default=os.getenv("DISTILL_MODEL", "gemini-3.1-pro-preview"), help="使用的模型")
    parser.add_argument("-t", "--template", default="", help="文化语义包模板路径")
    parser.add_argument("-p", "--prompt", default="", help="【高级】自定义 Prompt 模板文件路径")
    parser.add_argument("-img", "--images", nargs="+", help="附加的图片文件路径列表")
    
    args = parser.parse_args()

    print("=================================================")
    print("  __  __                               _        ")
    print(" |  \\/  | ___ _ __ ___   ___ _ __ | |_ ___  ")
    print(" | |\\/| |/ _ \\ '_ ` _ \\ / _ \\ '_ \\| __/ _ \\ ")
    print(" | |  | |  __/ | | | | |  __/ | | | || (_) |")
    print(" |_|  |_|\\___|_| |_| |_|\\___|_| |_|\\__\\___/  ")
    print("                                            ")
    print("       A I - S K I L L   D I S T I L L E R")
    print("=================================================")
    print('"Distilling Memories, Reconnecting Souls."\n')
    
    chat_data = ""
    if os.path.exists(args.input):
        try:
            with open(args.input, "r", encoding="utf-8") as f:
                chat_data = f.read()
        except Exception as e:
            print(f"警告: 无法读取文本文件 {args.input}: {e}")

    # 读取自定义 Prompt 文件
    custom_prompt_text = ""
    if args.prompt and os.path.exists(args.prompt):
        try:
            with open(args.prompt, "r", encoding="utf-8") as f:
                custom_prompt_text = f.read()
            print(f"已加载自定义 Prompt 模板: {args.prompt}")
        except Exception as e:
            print(f"警告: 无法读取自定义 Prompt {args.prompt}: {e}")

    if not chat_data and not args.images:
        print("错误: 必须提供聊天记录文本或图片。")
        return

    distill_from_text(chat_data, args.name, args.model, template_path=args.template, image_paths=args.images, custom_prompt_text=custom_prompt_text)

if __name__ == "__main__":
    main()
