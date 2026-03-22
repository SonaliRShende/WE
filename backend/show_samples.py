import json

with open('models/manual_gold_annotation_template.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print('\n📋 SAMPLE ANNOTATIONS:\n')
print('='*80)

# Show a violation record
print('EXAMPLE 1 (CONSTRAINT VIOLATION):')
r = data['records'][0]
print(f"User: {r['user_summary']['name']} @ {r['user_summary']['location']}")
print(f"Job: {r['job_summary']['job_title']} @ {r['job_summary']['location']}")
print(f"✓ Relevance: {r['relevance']}")
print(f"✓ Constraint Violation: {r['constraint_violation']}")
print(f"✓ Notes: {r['notes']}")

print('\n' + '='*80)

# Find a non-violation record
for rec in data['records']:
    if rec['constraint_violation'] == False and rec['relevance'] > 0:
        print('EXAMPLE 2 (SOMEWHAT SUITABLE):')
        print(f"User: {rec['user_summary']['name']} @ {rec['user_summary']['location']}")
        print(f"Job: {rec['job_summary']['job_title']} @ {rec['job_summary']['location']}")
        print(f"Job Type: {rec['job_summary']['job_type']}")
        print(f"Skills: {', '.join(rec['user_summary']['skills'][:3])}")
        print(f"✓ Relevance: {rec['relevance']}")
        print(f"✓ Constraint Violation: {rec['constraint_violation']}")
        print(f"✓ Notes: {rec['notes']}")
        break

print('\n' + '='*80)
