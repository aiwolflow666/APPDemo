#!/usr/bin/env python3
"""
托业学习助手本地测试脚本
用于验证优化效果
"""

import json
import os
import re
from collections import Counter
import random

def load_word_database():
    """加载单词数据库"""
    try:
        with open('word_database.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"成功加载单词数据库: {len(data)} 个单词")
        
        # 统计词性分布
        pos_counter = Counter()
        for word in data:
            if 'pos' in word and isinstance(word['pos'], list):
                for pos in word['pos']:
                    pos_counter[pos] += 1
        
        print(f"词性分布: {dict(pos_counter)}")
        return data
    except Exception as e:
        print(f"加载单词数据库失败: {e}")
        return []

def analyze_practice_coach():
    """分析题库练习HTML文件"""
    try:
        with open('practice_coach.html', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 检查关键优化点
        checks = {
            'word_database_loaded': 'loadWordDatabase' in content,
            'word_based_prompt': 'generateWordBasedPrompt' in content,
            'hash_check_improved': 'recentHashes.slice(-60)' in content or 'recentHashes.slice(-100)' in content,
            'background_refill': 'backgroundRefill' in content,
            'clear_hashes_button': 'clearHashesBtn' in content,
        }
        
        print("题库练习优化检查:")
        for check_name, passed in checks.items():
            status = "[OK]" if passed else "[FAIL]"
            print(f"  {status} {check_name}: {passed}")
        
        # 检查单词选择算法
        if 'getRandomWords' in content:
            print("检测到改进的随机单词选择算法")
        
        return all(checks.values())
    except Exception as e:
        print(f"❌ 分析题库练习文件失败: {e}")
        return False

def check_index_html():
    """检查统一入口页面"""
    try:
        with open('index.html', 'r', encoding='utf-8') as f:
            content = f.read()
        
        checks = {
            'has_vocabulary_link': 'vocabulary_app.html' in content,
            'has_practice_link': 'practice_coach.html' in content,
            'mobile_friendly': 'viewport-fit=cover' in content,
            'responsive_design': 'grid-template-columns' in content,
        }
        
        print("🔍 统一入口页面检查:")
        for check_name, passed in checks.items():
            status = "✅" if passed else "❌"
            print(f"  {status} {check_name}: {passed}")
        
        return all(checks.values())
    except Exception as e:
        print(f"❌ 检查统一入口页面失败: {e}")
        return False

def simulate_question_generation():
    """模拟题目生成逻辑测试"""
    print("\n🧪 模拟题目生成测试:")
    
    # 模拟单词选择
    words = load_word_database()
    if words:
        # 测试随机选择
        sample_size = 20
        selected_words = random.sample(words, min(sample_size, len(words)))
        
        print(f"📝 随机选择 {len(selected_words)} 个单词示例:")
        for i, word in enumerate(selected_words[:5], 1):
            print(f"  {i}. {word.get('word', 'N/A')} ({word.get('pos', 'N/A')}): {word.get('meaning', 'N/A')}")
        
        if len(selected_words) > 5:
            print(f"  ... 还有 {len(selected_words) - 5} 个单词")
        
        # 检查词性多样性
        pos_set = set()
        for word in selected_words:
            if 'pos' in word:
                if isinstance(word['pos'], list):
                    pos_set.update(word['pos'])
                else:
                    pos_set.add(word['pos'])
        
        print(f"🎯 词性多样性: {len(pos_set)} 种不同的词性")
        return True
    return False

def create_test_server_instructions():
    """生成测试服务器说明"""
    print("\n🌐 本地测试服务器说明:")
    print("=" * 50)
    
    # 获取本机IP（简化版）
    import socket
    try:
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        print(f"📱 你的电脑IP地址: {local_ip}")
    except:
        print("📱 你的电脑IP地址: [请查看网络设置]")
    
    print("\n📋 启动测试服务器的方法:")
    print("1. Python 3:")
    print("   python -m http.server 8000")
    print("   或指定端口: python -m http.server 8080")
    
    print("\n2. Node.js (如果有安装):")
    print("   npx http-server -p 8000")
    
    print("\n3. PHP (如果有安装):")
    print("   php -S 0.0.0.0:8000")
    
    print("\n📱 手机访问地址:")
    print(f"   http://[你的电脑IP]:8000/index.html")
    print(f"   例如: http://{local_ip if 'local_ip' in locals() else '192.168.1.100'}:8000/index.html")
    
    print("\n🔧 快速测试命令:")
    print("   1. 检查文件: python local_test.py")
    print("   2. 启动服务器: python -m http.server 8000")
    print("   3. 浏览器访问: http://localhost:8000/index.html")

def main():
    print("=" * 60)
    print("托业学习助手 - 本地测试验证")
    print("=" * 60)
    
    # 检查所有文件
    files_to_check = ['index.html', 'vocabulary_app.html', 'practice_coach.html', 'word_database.json']
    missing_files = []
    
    for file in files_to_check:
        if os.path.exists(file):
            print(f"✅ {file} 存在")
        else:
            print(f"❌ {file} 缺失")
            missing_files.append(file)
    
    if missing_files:
        print(f"\n⚠️  警告: 缺失 {len(missing_files)} 个文件")
        return
    
    print("\n" + "=" * 60)
    
    # 运行各项检查
    all_passed = True
    
    # 1. 检查单词数据库
    words = load_word_database()
    if not words:
        all_passed = False
        print("❌ 单词数据库检查失败")
    
    # 2. 检查题库练习优化
    if not analyze_practice_coach():
        all_passed = False
    
    # 3. 检查统一入口
    if not check_index_html():
        all_passed = False
    
    # 4. 模拟题目生成
    if not simulate_question_generation():
        all_passed = False
    
    print("\n" + "=" * 60)
    
    if all_passed:
        print("🎉 所有检查通过！优化已成功应用。")
    else:
        print("⚠️  部分检查未通过，请查看上面的错误信息。")
    
    # 生成测试说明
    create_test_server_instructions()
    
    print("\n" + "=" * 60)
    print("📋 手动测试步骤:")
    print("1. 启动本地HTTP服务器")
    print("2. 用浏览器访问 index.html")
    print("3. 点击'单词记忆'测试单词功能")
    print("4. 点击'题库练习'测试题目生成")
    print("5. 在题库练习中连续做题，观察题目多样性")
    print("6. 使用'清空题目缓存'按钮测试去重功能")
    
    print("\n💡 提示:")
    print("- 题库练习需要API Key才能生成真实题目")
    print("- 如果没有API Key，可以测试界面和本地功能")
    print("- 单词记忆功能完全本地运行，无需API")

if __name__ == "__main__":
    main()