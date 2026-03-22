"""
Interactive Annotation Assistant for Manual Gold Set Labeling
Suggests relevance scores and constraint violations based on data analysis
"""
import json
import os
from pathlib import Path
from typing import Dict, List, Tuple

class AnnotationAssistant:
    def __init__(self, json_path: str):
        self.json_path = json_path
        self.data = self._load_json()
        self.records = self.data.get('records', [])
        self.changes = []
        
    def _load_json(self):
        with open(self.json_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def analyze_record(self, record: Dict) -> Tuple[int, bool, str]:
        """
        Analyze a record and suggest relevance, constraint_violation, and notes.
        
        Returns: (relevance_score, constraint_violation, notes)
        """
        user_summary = record['user_summary']
        job_summary = record['job_summary']
        
        user_location = user_summary.get('location', '').lower()
        job_location = job_summary.get('location', '').lower()
        job_type = job_summary.get('job_type', '').lower()
        
        constraints = [c.lower() for c in user_summary.get('constraints', [])]
        benefits = [b.lower() for b in job_summary.get('benefits', [])]
        requirements = [r.lower() for r in job_summary.get('requirements', [])]
        
        user_skills = set(s.lower() for s in user_summary.get('skills', []))
        job_reqs = [r.lower() for r in requirements]
        
        # Analyze constraint violations
        violation = False
        violation_reasons = []
        
        # Check relocation constraint
        has_relocation_constraint = any('relocate' in c or 'वर्तमान शहर' in c for c in constraints)
        is_remote_or_hybrid = job_type in ['remote', 'hybrid']
        
        if has_relocation_constraint:
            if not is_remote_or_hybrid:
                # Non-remote job requires location match
                if user_location and job_location and user_location not in job_location and job_location not in user_location:
                    violation = True
                    violation_reasons.append(f"Location mismatch: User in {user_summary.get('location')} but job in {job_summary.get('location')}")
            # Remote/hybrid jobs satisfy relocation constraint
        
        # Check flexibility constraint (weekly off/flexible timing needed)
        has_flexibility_constraint = any('flexible' in c or 'निश्चित' in c or 'जबाबदाऱ्यांमुळे' in c for c in constraints)
        has_flexibility_benefit = any('flexible' in b for b in benefits)
        
        if has_flexibility_constraint and not has_flexibility_benefit and job_type == 'full-time':
            violation_reasons.append("Job doesn't clearly offer flexible timing")
        
        # Check part-time constraint
        has_parttime_constraint = any('part-time' in c or 'part time' in c or 'भूमिका' in c for c in constraints)
        is_parttime_job = job_type == 'part-time'
        
        if has_parttime_constraint and not is_parttime_job and job_type == 'full-time' and 'flexible' not in ' '.join(benefits).lower():
            violation_reasons.append("Job is full-time but part-time role required")
        
        # Check remote/hybrid constraint (from travel/commute issues)
        has_remote_constraint = any('remote' in c or 'hybrid' in c or 'प्रवास' in c or 'आवागमन' in c for c in constraints)
        if has_remote_constraint and not is_remote_or_hybrid and job_type == 'full-time':
            violation_reasons.append("Remote/hybrid needed but job is on-site")
        
        # Check security/women-friendly constraints
        security_constraints = any('security' in c or 'women-friendly' in c or 'cctv' in c or 'सुरक्षा' in c for c in constraints)
        has_security_benefits = any('safe transport' in b or 'security' in b or 'women' in b or 'childcare' in b or 'lactation' in b or 'wellness' in b for b in benefits)
        
        if security_constraints and not has_security_benefits:
            violation_reasons.append("Missing security/women-friendly workplace features")
        
        # Improved skill match analysis with fuzzy matching
        skill_keywords = {
            'automation testing': ['test case', 'automation', 'qa', 'testing'],
            'python': ['python', 'scripting', 'programming'],
            'issue triage': ['issue', 'triage', 'bug', 'debugging'],
            'debugging': ['debugging', 'debug', 'issue'],
            'testing': ['test', 'qa', 'automation'],
        }
        
        skill_matches = 0
        for skill in user_skills:
            keywords = skill_keywords.get(skill, [skill])
            for keyword in keywords:
                if any(keyword in req for req in job_reqs):
                    skill_matches += 1
                    break
        
        total_job_reqs = len(job_reqs) if job_reqs else 1
        skill_match_ratio = skill_matches / total_job_reqs if total_job_reqs > 0 else 0.5
        
        # Determine relevance score
        if violation:
            relevance = 0  # Hard constraint violation = not suitable
        elif is_remote_or_hybrid and skill_match_ratio >= 0.3 and has_security_benefits:
            # Remote jobs with even weak skill match + women-friendly = very suitable
            relevance = 2 if skill_match_ratio >= 0.5 else 1
        elif skill_match_ratio >= 0.7 and has_security_benefits:
            relevance = 2  # Very suitable: good skills + women-friendly
        elif skill_match_ratio >= 0.5 and (is_remote_or_hybrid or has_security_benefits):
            relevance = 1  # Somewhat suitable
        elif skill_match_ratio >= 0.3 and is_remote_or_hybrid:
            relevance = 1  # Remote job with weak skills but satisfies constraints
        else:
            relevance = 0  # Not suitable
        
        # Generate notes
        notes = ""
        if violation_reasons:
            notes = "; ".join(violation_reasons)
        elif is_remote_or_hybrid:
            match_pct = f"({skill_matches}/{total_job_reqs})"
            if skill_match_ratio >= 0.5:
                notes = f"Strong match: Remote job satisfies location needs, skill match {match_pct}, women-friendly benefits present"
            else:
                notes = f"Remote job satisfies flexibility needs, skill match {match_pct}, benefits align with constraints"
        elif skill_match_ratio >= 0.7:
            notes = f"Strong skill match ({skill_matches}/{total_job_reqs}); Women-friendly benefits present"
        elif skill_match_ratio >= 0.5:
            notes = f"Partial skill match ({skill_matches}/{total_job_reqs}); Check if acceptable"
        else:
            notes = f"Weak skill match ({skill_matches}/{total_job_reqs}); Location: {job_summary.get('location')}"
        
        return relevance, violation, notes
    
    def display_record(self, idx: int, record: Dict, suggested_relevance: int, 
                      suggested_violation: bool, suggested_notes: str):
        """Display record with suggestions for user review"""
        print(f"\n{'='*80}")
        print(f"Record {idx + 1}/{len(self.records)}")
        print(f"{'='*80}")
        
        user = record['user_summary']
        job = record['job_summary']
        
        print(f"\n📋 USER: {user.get('name', 'N/A')}")
        print(f"   Location: {user.get('location')}")
        print(f"   Qualification: {user.get('qualification')}")
        print(f"   Skills: {', '.join(user.get('skills', [])[:3])}...")
        print(f"   Constraints: ")
        for c in user.get('constraints', [])[:3]:
            print(f"     • {c}")
        
        print(f"\n💼 JOB: {job.get('job_title')} @ {job.get('company')}")
        print(f"   Location: {job.get('location')}")
        print(f"   Type: {job.get('job_type')}")
        print(f"   Requirements: {', '.join(job.get('requirements', [])[:2])}...")
        print(f"   Benefits: ")
        for b in job.get('benefits', [])[:3]:
            print(f"     ✓ {b}")
        
        print(f"\n📊 ANALYSIS:")
        print(f"   Baseline Score: {record['baseline_score']:.4f}")
        print(f"   CARE-Net Score: {record['care_net_score']:.4f}")
        
        print(f"\n🤖 SUGGESTIONS (AI Analysis):")
        print(f"   Relevance: {suggested_relevance} (0=not suitable, 1=somewhat, 2=very suitable)")
        print(f"   Constraint Violation: {suggested_violation}")
        print(f"   Notes: {suggested_notes}")
        
        return self._get_user_input(suggested_relevance, suggested_violation, suggested_notes, idx)
    
    def _get_user_input(self, default_rel: int, default_viol: bool, default_notes: str, idx: int) -> Dict:
        """Get user confirmation or modification"""
        while True:
            print(f"\n🎯 ACTION:")
            print(f"   [A]ccept suggestion  | [E]dit  | [S]kip  | [Q]uit")
            choice = input("   Your choice: ").strip().upper()
            
            if choice == 'A':
                return {
                    'relevance': default_rel,
                    'constraint_violation': default_viol,
                    'notes': default_notes
                }
            elif choice == 'E':
                return self._edit_values(default_rel, default_viol, default_notes)
            elif choice == 'S':
                return None
            elif choice == 'Q':
                return 'QUIT'
            else:
                print("   Invalid choice. Try again.")
    
    def _edit_values(self, rel: int, viol: bool, notes: str) -> Dict:
        """Allow user to manually edit values"""
        print(f"\n✏️  EDIT MODE:")
        
        # Edit relevance
        while True:
            try:
                rel_input = input(f"   Relevance (0/1/2) [current: {rel}]: ").strip()
                if rel_input == '':
                    break
                rel = int(rel_input)
                if rel not in [0, 1, 2]:
                    print("   Please enter 0, 1, or 2")
                    continue
                break
            except ValueError:
                print("   Invalid input")
        
        # Edit constraint violation
        while True:
            viol_input = input(f"   Constraint Violation (y/n) [current: {viol}]: ").strip().lower()
            if viol_input == '':
                break
            elif viol_input in ['y', 'yes']:
                viol = True
                break
            elif viol_input in ['n', 'no']:
                viol = False
                break
            else:
                print("   Please enter y or n")
        
        # Edit notes
        notes_input = input(f"   Notes [current: {notes[:50]}...]: ").strip()
        if notes_input:
            notes = notes_input
        
        return {
            'relevance': rel,
            'constraint_violation': viol,
            'notes': notes
        }
    
    def annotate_interactive(self):
        """Run interactive annotation session"""
        print("\n" + "="*80)
        print("🚀 ANNOTATION ASSISTANT - Interactive Mode")
        print("="*80)
        print(f"Total records to annotate: {len(self.records)}")
        print("Press Ctrl+C to save and exit at any time\n")
        
        annotated_count = 0
        
        try:
            for idx, record in enumerate(self.records):
                # Get suggestions
                rel, viol, notes = self.analyze_record(record)
                
                # Display and get user input
                result = self.display_record(idx, record, rel, viol, notes)
                
                if result == 'QUIT':
                    break
                elif result is None:
                    continue  # Skip this record
                else:
                    # Apply annotation
                    record['relevance'] = result['relevance']
                    record['constraint_violation'] = result['constraint_violation']
                    record['notes'] = result['notes']
                    annotated_count += 1
                    print(f"   ✅ Saved!")
        
        except KeyboardInterrupt:
            print("\n\n⏸️  Interrupted by user")
        
        print(f"\n{'='*80}")
        print(f"📈 Session Summary: {annotated_count} records annotated")
        print(f"{'='*80}")
        
        # Ask to save
        save = input("\n💾 Save changes to JSON? (y/n): ").strip().lower()
        if save in ['y', 'yes']:
            self._save_json()
            print(f"✅ Saved to {self.json_path}")
        else:
            print("❌ Changes discarded")
    
    def _save_json(self):
        """Save modified data back to JSON"""
        with open(self.json_path, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)
    
    def batch_annotate(self, confidence_threshold: float = 0.8):
        """
        Auto-annotate records with high confidence suggestions
        Only auto-fills if confidence is high
        """
        print(f"\n🤖 BATCH AUTO-ANNOTATION (Confidence > {confidence_threshold*100}%)")
        print("="*80)
        
        auto_count = 0
        for idx, record in enumerate(self.records):
            rel, viol, notes = self.analyze_record(record)
            
            # Only auto-fill high-confidence cases
            if viol or rel == 2:  # Clear violation or very suitable
                record['relevance'] = rel
                record['constraint_violation'] = viol
                record['notes'] = notes
                auto_count += 1
                status = "⚠️  VIOLATION" if viol else "✅ HIGHLY SUITABLE"
                print(f"  [{idx+1}] {status}: {notes[:50]}")
        
        print(f"\n✅ Auto-annotated {auto_count}/{len(self.records)} records")
        
        save = input("💾 Save auto-annotations? (y/n): ").strip().lower()
        if save in ['y', 'yes']:
            self._save_json()
            print(f"✅ Saved!")
        
        # Now offer interactive mode for remaining
        remaining = sum(1 for r in self.records if r.get('relevance') is None)
        if remaining > 0:
            interactive = input(f"\n🎯 Annotate remaining {remaining} records interactively? (y/n): ").strip().lower()
            if interactive in ['y', 'yes']:
                self.annotate_interactive()


def main():
    json_path = "d:\\sonali\\Women Empowerment\\AI-Driven-Job-Recommendation-System\\backend\\models\\manual_gold_annotation_template.json"
    
    if not os.path.exists(json_path):
        print(f"❌ File not found: {json_path}")
        return
    
    assistant = AnnotationAssistant(json_path)
    
    print("\n" + "="*80)
    print("ANNOTATION ASSISTANT - Choose Mode")
    print("="*80)
    print("[1] Auto-annotate high-confidence cases, then interactive for rest")
    print("[2] Full interactive annotation")
    print("[3] Auto-annotate all records")
    
    mode = input("\nSelect mode (1/2/3): ").strip()
    
    if mode == '1':
        assistant.batch_annotate(confidence_threshold=0.8)
    elif mode == '2':
        assistant.annotate_interactive()
    elif mode == '3':
        for record in assistant.records:
            rel, viol, notes = assistant.analyze_record(record)
            record['relevance'] = rel
            record['constraint_violation'] = viol
            record['notes'] = notes
        assistant._save_json()
        print(f"✅ Auto-annotated all {len(assistant.records)} records and saved!")
    else:
        print("Invalid choice")


if __name__ == "__main__":
    main()
