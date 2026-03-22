#!/usr/bin/env python3
"""
Quick auto-annotation script without interactive mode
"""
from annotation_assistant import AnnotationAssistant

json_path = r'd:\sonali\Women Empowerment\AI-Driven-Job-Recommendation-System\backend\models\manual_gold_annotation_template.json'

print('\n🔄 RE-ANNOTATING ALL RECORDS WITH IMPROVED ALGORITHM...\n')

assistant = AnnotationAssistant(json_path)
rel_0 = rel_1 = rel_2 = viol_yes = viol_no = 0

for idx, record in enumerate(assistant.records):
    rel, viol, notes = assistant.analyze_record(record)
    record['relevance'] = rel
    record['constraint_violation'] = viol
    record['notes'] = notes
    
    if rel == 0: rel_0 += 1
    elif rel == 1: rel_1 += 1
    else: rel_2 += 1
    
    if viol: viol_yes += 1
    else: viol_no += 1
    
    if (idx + 1) % 100 == 0:
        print(f'  Processed {idx + 1}/{len(assistant.records)} records...')

assistant._save_json()
print(f'\n✅ COMPLETED! All {len(assistant.records)} records re-annotated\n')
print('📊 UPDATED STATISTICS:')
print(f'  Not Suitable (0): {rel_0} records')
print(f'  Somewhat Suitable (1): {rel_1} records')
print(f'  Very Suitable (2): {rel_2} records')
print(f'  Constraint Violations: {viol_yes}')
print(f'  No Violations: {viol_no}')
print(f'\n💾 Saved!')
