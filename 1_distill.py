import os
import json
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

def distill_persona(input_file="data/sample_chat.txt", output_file="output/persona_config.json"):
    """
    读取聊天记录，使用大模型提取人物特征，并生成 System Instruction。
    """
    # 确保输出目录存在
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    # 读取聊天记录
    try:
        with open(input_file, "r", encoding="utf-8") as f:
            chat_data = f.read()
    except FileNotFoundError:
        print(f"错误: 找不到文件 {input_file}。请确保聊天记录文件存在。")
        return

    print("正在分析聊天记录，提取人物特征...")

    # 构造 Prompt
    prompt = f"""
    你现在是一位资深的心理学专家和人物分析师。请仔细阅读以下聊天记录，并从中提取目标人物（在对话中扮演长辈/亲人角色的一方）的特征。

    聊天记录：
    {chat_data}

    请提取以下信息，并最终生成一段高度还原的“第一人称 System Instruction”（系统提示词）：
    1. 称呼习惯（ta怎么称呼对方，怎么自称）
    2. 口头禅或常用语气词
    3. 性格特征
    4. 核心价值观或关心的事物
    5. 说话的语气和情感基调

    最后，请输出一段纯文本的 System Instruction，要求：
    - 使用第一人称（"我"）
    - 语气要温暖、有感情、充满关怀
    - 严格符合上述提取的特征
    - 明确指示 AI 在后续对话中必须完全扮演这个角色，绝不能出戏，不要承认自己是 AI。

    请将结果以 JSON 格式输出，包含 "analysis" (分析过程) 和 "system_instruction" (最终的提示词) 两个字段。
    """

    try:
        # 使用 Gemini 1.5 Pro 模型以获得更好的分析和推理能力
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        # 强制要求返回 JSON 格式
        response = model.generate_content(
            prompt, 
            generation_config={"response_mime_type": "application/json"}
        )

        # 解析 JSON 结果
        result = json.loads(response.text)

        # 保存到配置文件
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=4)

        print(f"蒸馏完成！人物配置文件已保存至: {output_file}")
        print("\n=== 生成的 System Instruction 预览 ===")
        print(result.get("system_instruction", ""))
        print("======================================")

    except Exception as e:
        print(f"API 调用或处理过程中发生错误: {e}")

if __name__ == "__main__":
    distill_persona()
