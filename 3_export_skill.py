import os
import json
import glob
import argparse

def convert_to_skill(input_file, output_file):
    """
    将 Memento 生成的 config.json 转换为通用的 AgentSkill 格式 (.skill.json)
    """
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            config = json.load(f)
            
        persona_name = os.path.basename(input_file).replace("_config.json", "")
        
        # 组装通用的 AgentSkill 格式
        skill_data = {
            "manifest_version": "2.0",
            "skill_id": f"memento_persona_{persona_name}",
            "name": f"Memento Digital Twin: {persona_name}",
            "type": "persona",
            "backend": "gemini",
            "instructions": config.get("system_instruction", ""),
            "analysis": config.get("analysis", ""),
            "knowledge_base": [],
            "tools": []
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(skill_data, f, ensure_ascii=False, indent=2)
            
        print(f"成功导出 Skill 文件: {output_file}")
        
    except Exception as e:
        print(f"导出失败 {input_file}: {e}")

def main():
    parser = argparse.ArgumentParser(description="导出 Memento 配置为 AgentSkill 格式")
    parser.add_argument("-i", "--input", help="指定的 _config.json 文件路径")
    args = parser.parse_args()
    
    output_dir = "exported_skills"
    os.makedirs(output_dir, exist_ok=True)
    
    if args.input:
        if not os.path.exists(args.input):
            print(f"错误: 找不到文件 {args.input}")
            return
        persona_name = os.path.basename(args.input).replace("_config.json", "")
        output_file = os.path.join(output_dir, f"{persona_name}.skill.json")
        convert_to_skill(args.input, output_file)
    else:
        # 批量转换 output 目录下的所有配置
        config_files = glob.glob("output/*_config.json")
        if not config_files:
            print("错误: output 目录下没有找到任何配置文件。")
            return
            
        print(f"找到 {len(config_files)} 个配置文件，正在批量导出...")
        for file_path in config_files:
            persona_name = os.path.basename(file_path).replace("_config.json", "")
            output_file = os.path.join(output_dir, f"{persona_name}.skill.json")
            convert_to_skill(file_path, output_file)

if __name__ == "__main__":
    main()
