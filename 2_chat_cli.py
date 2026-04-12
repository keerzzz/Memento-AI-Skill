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

def start_cli_chat(config_file="output/persona_config.json"):
    """
    加载人物配置，启动 CLI 交互对话界面。
    """
    # 加载人物配置
    try:
        with open(config_file, "r", encoding="utf-8") as f:
            config = json.load(f)
            system_instruction = config.get("system_instruction", "")
    except FileNotFoundError:
        print(f"错误: 找不到配置文件 {config_file}。请先运行 1_distill.py 生成配置。")
        return
    except json.JSONDecodeError:
        print(f"错误: 配置文件 {config_file} 格式不正确。")
        return

    if not system_instruction:
        print("错误: 配置文件中未找到 system_instruction。")
        return

    print("正在唤醒数字镜像...")

    try:
        # 初始化模型，注入 System Instruction
        # 交互对话使用 flash 模型，响应更快
        model = genai.GenerativeModel(
            model_name='gemini-1.5-flash', 
            system_instruction=system_instruction
        )

        # 开启多轮对话
        chat = model.start_chat(history=[])

        print("\n==================================================")
        print("连接已建立。现在你可以开始对话了。(输入 'quit' 或 'exit' 退出)")
        print("==================================================\n")

        while True:
            user_input = input("你: ")
            if user_input.lower() in ['quit', 'exit']:
                print("\n对话结束。愿这份温暖一直陪伴你。")
                break
            if not user_input.strip():
                continue

            # 发送消息并获取回复
            response = chat.send_message(user_input)
            print(f"\nTa: {response.text}\n")

    except Exception as e:
        print(f"对话过程中发生错误: {e}")

if __name__ == "__main__":
    start_cli_chat()
