#!/usr/bin/env python3
"""
托业学习助手简化测试脚本
"""

import json
import os
import sys

def check_files():
    """检查文件完整性"""
    print("=" * 60)
    print("托业学习助手 - 文件完整性检查")
    print("=" * 60)
    
    files = [
        ('index.html', '统一入口页面'),
        ('vocabulary_app.html', '单词学习应用'),
        ('practice_coach.html', '题库练习应用'),
        ('word_database.json', '单词数据库'),
    ]
    
    all_ok = True
    for filename, description in files:
        if os.path.exists(filename):
            print(f"[OK] {filename} - {description}")
        else:
            print(f"[FAIL] {filename} - {description} 缺失")
            all_ok = False
    
    return all_ok

def check_word_database():
    """检查单词数据库"""
    print("\n" + "=" * 60)
    print("单词数据库检查")
    print("=" * 60)
    
    try:
        with open('word_database.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"单词数量: {len(data)}")
        
        if len(data) > 0:
            # 显示前5个单词作为示例
            print("\n示例单词:")
            for i, word in enumerate(data[:5], 1):
                word_str = word.get('word', 'N/A')
                pos = word.get('pos', 'N/A')
                meaning = word.get('meaning', 'N/A')
                print(f"  {i}. {word_str} ({pos}): {meaning}")
            
            if len(data) > 5:
                print(f"  ... 还有 {len(data) - 5} 个单词")
        
        return True
    except Exception as e:
        print(f"加载失败: {e}")
        return False

def check_optimizations():
    """检查优化内容"""
    print("\n" + "=" * 60)
    print("优化内容检查")
    print("=" * 60)
    
    try:
        with open('practice_coach.html', 'r', encoding='utf-8') as f:
            content = f.read()
        
        optimizations = [
            ('loadWordDatabase', '单词数据库加载'),
            ('generateWordBasedPrompt', '单词提示生成'),
            ('recentHashes.slice(-60)', '题目去重改进'),
            ('backgroundRefill', '后台题目补充'),
            ('clearHashesBtn', '题目缓存管理'),
        ]
        
        all_ok = True
        for func_name, description in optimizations:
            if func_name in content:
                print(f"[OK] {description}")
            else:
                print(f"[FAIL] {description}")
                all_ok = False
        
        return all_ok
    except Exception as e:
        print(f"检查失败: {e}")
        return False

def generate_test_instructions():
    """生成测试说明"""
    print("\n" + "=" * 60)
    print("本地测试说明")
    print("=" * 60)
    
    print("\n1. 启动本地服务器:")
    print("   python -m http.server 8000")
    print("   或: npx http-server -p 8000")
    
    print("\n2. 访问地址:")
    print("   电脑: http://localhost:8000/index.html")
    print("   手机: http://[电脑IP]:8000/index.html")
    
    print("\n3. 测试步骤:")
    print("   a. 访问统一入口页面")
    print("   b. 测试单词记忆功能")
    print("   c. 测试题库练习功能")
    print("   d. 验证题目多样性")
    
    print("\n4. 获取电脑IP:")
    print("   Windows: ipconfig")
    print("   Mac/Linux: ifconfig 或 ip addr")

def main():
    print("托业学习助手本地测试验证")
    print("=" * 60)
    
    # 检查文件
    files_ok = check_files()
    if not files_ok:
        print("\n[ERROR] 文件不完整，请检查")
        return
    
    # 检查单词数据库
    db_ok = check_word_database()
    
    # 检查优化
    opt_ok = check_optimizations()
    
    print("\n" + "=" * 60)
    print("测试结果汇总")
    print("=" * 60)
    
    if files_ok and db_ok and opt_ok:
        print("[SUCCESS] 所有检查通过！优化已成功应用。")
    else:
        print("[WARNING] 部分检查未通过。")
    
    # 生成测试说明
    generate_test_instructions()
    
    print("\n" + "=" * 60)
    print("提示: 双击 quick_test.bat 可快速启动测试服务器")
    print("=" * 60)

if __name__ == "__main__":
    main()