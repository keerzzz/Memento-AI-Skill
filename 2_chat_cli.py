import os
import json
import time
import sys
import glob
import argparse
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

def load_history(filepath):
    """从 JSON 文件加载聊天历史记录"""
    if not os.path.exists(filepath):
        return []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        history = []
        for item in data:
            history.append({
                'role': item['role'],
                'parts': [{'text': item['parts'][0]}]
            })
        return history
    except Exception as e:
        print(f"读取历史记录失败: {e}，将开启全新对话。")
        return []

def save_history(filepath, chat_history):
    """将聊天历史记录保存到 JSON 文件"""
    data = []
    for msg in chat_history:
        text = msg.parts[0].text if msg.parts else ""
        data.append({
            'role': msg.role,
            'parts': [text]
        })
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def main():
    """
    加载人物配置，启动 CLI 交互对话界面。
    支持保存/加载历史记录，以及通过命令行参数指定模型。
    """
    parser = argparse.ArgumentParser(description="Memento AI 交互对话工具")
    parser.add_argument("-m", "--model", default=os.getenv("CHAT_MODEL", "gemini-3-flash-preview"), help="使用的 Gemini 模型")
    args = parser.parse_args()

    print("=== Memento AI 数字镜像唤醒 ===")
    output_dir = "output"
    if not os.path.exists(output_dir):
        print("错误: output 目录不存在，请先运行 1_distill.py 生成配置。")
        return
        
    config_files = glob.glob(os.path.join(output_dir, "*_config.json"))
    if not config_files:
        print("错误: 未找到任何人物配置文件，请先运行 1_distill.py。")
        return
        
    print("可用的数字镜像:")
    for i, file_path in enumerate(config_files):
        filename = os.path.basename(file_path)
        persona_name = filename.replace("_config.json", "")
        print(f"[{i+1}] {persona_name}")
        
    choice = input(f"请选择要唤醒的数字镜像编号 (1-{len(config_files)}，默认: 1): ").strip()
    try:
        idx = int(choice) - 1 if choice else 0
        if idx < 0 or idx >= len(config_files):
            print("无效的选择，使用默认选项 1。")
            idx = 0
        config_file = config_files[idx]
    except ValueError:
        print("无效的选择，使用默认选项 1。")
        config_file = config_files[0]
        
    persona_name = os.path.basename(config_file).replace("_config.json", "")
    history_file = os.path.join(output_dir, f"{persona_name}_history.json")
    
    print(f"\n正在加载配置: {config_file}")

    try:
        with open(config_file, "r", encoding="utf-8") as f:
            config = json.load(f)
            system_instruction = config.get("system_instruction", "")
    except Exception as e:
        print(f"错误: 读取配置文件失败 {e}")
        return

    if not system_instruction:
        print("错误: 配置文件中未找到 system_instruction。")
        return

    # 检查并加载历史记录
    history = []
    if os.path.exists(history_file):
        resume = input(f"发现 {persona_name} 的历史对话记录，是否恢复? (y/n, 默认: y): ").strip().lower()
        if resume != 'n':
            history = load_history(history_file)
            print(f"已加载 {len(history)} 条历史消息。")

    print(f"正在使用模型 {args.model} 唤醒数字镜像...")

    try:
        model = genai.GenerativeModel(
            model_name=args.model, 
            system_instruction=system_instruction
        )

        chat = model.start_chat(history=history)

        print("\n==================================================")
        print("连接已建立。现在你可以开始对话了。(输入 'quit' 或 'exit' 退出)")
        print("==================================================\n")

        # 如果是恢复历史，打印最后几条消息作为上下文回顾
        if history:
            print("--- 历史消息回顾 ---")
            for msg in history[-4:]: # 显示最后4条
                role_name = "你" if msg['role'] == 'user' else "Ta"
                print(f"{role_name}: {msg['parts'][0]['text']}")
            print("--------------------\n")

        while True:
            user_input = input("你: ")
            if user_input.lower() in ['quit', 'exit']:
                print("\n对话结束。愿这份温暖一直陪伴你。")
                break
            if not user_input.strip():
                continue

            # 模拟思考延迟 (2.5秒)
            print("Ta 正在感受你的心意...", end="\r")
            time.sleep(2.5) 
            print(" " * 30, end="\r") # 清除提示
            
            print("Ta: ", end="")
            
            # 流式输出并模拟打字速度
            response = chat.send_message(user_input, stream=True)
            for chunk in response:
                for char in chunk.text:
                    sys.stdout.write(char)
                    sys.stdout.flush()
                    time.sleep(0.05) # 模拟长辈较慢的打字速度
            print("\n")
            
            # 每次对话后保存历史记录
            save_history(history_file, chat.history)

    except Exception as e:
        print(f"对话过程中发生错误: {e}")

if __name__ == "__main__":
    main()
