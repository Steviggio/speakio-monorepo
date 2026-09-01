import os
import re

PAGE_PATH = r"c:\Users\dev\Documents\steve\antigravity\apps\web\app\(main)\resources\page.tsx"
COMPONENTS_DIR = r"c:\Users\dev\Documents\steve\antigravity\apps\web\app\(main)\resources\components"
UTILS_PATH = r"c:\Users\dev\Documents\steve\antigravity\apps\web\app\(main)\resources\utils.ts"

os.makedirs(COMPONENTS_DIR, exist_ok=True)

with open(PAGE_PATH, "r", encoding="utf-8") as f:
    content = f.read()

def replace_tw_classes(text):
    text = text.replace("[var(--color-border)]", "-(--color-border)")
    text = text.replace("[var(--color-border-light)]", "border-light")
    text = text.replace("[var(--color-text-secondary)]", "text-secondary")
    text = text.replace("[var(--color-text-muted)]", "text-muted")
    text = text.replace("[var(--color-text)]", "-(--color-text)")
    text = text.replace("[var(--color-bg-hover)]", "bg-hover")
    text = text.replace("[var(--color-brand)]", "brand")
    text = text.replace('className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"', 'className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start"')
    return text

content = replace_tw_classes(content)

# Extract Utils
utils_match = re.search(r"// ─── Utilities ───.*?// ─── Sub-components ───", content, re.DOTALL)
if utils_match:
    utils_code = utils_match.group(0)
    # Add exports to functions
    utils_code = re.sub(r"function (\w+)\(", r"export function \1(", utils_code)
    
    # Write to utils.ts
    with open(UTILS_PATH, "w", encoding="utf-8") as f:
        f.write('import { ResourceItem } from "@/lib/api/resources";\n\n')
        
        # DomainGroup needs to be exported from somewhere. Let's put it in utils.ts
        domain_group_type = """export interface DomainGroup {
  domain: string;
  label: string;
  resources: ResourceItem[];
}

"""
        f.write(domain_group_type)
        f.write(utils_code.replace("// ─── Sub-components ───", ""))
    
    # Remove utils from page.tsx
    content = content.replace(utils_match.group(0), "// ─── Sub-components ───")
    
    # Remove DomainGroup interface from page.tsx (already moved to utils)
    content = re.sub(r"interface DomainGroup \{.*?\n\}\n", "", content, flags=re.DOTALL)
    
    # Add imports to page.tsx
    utils_imports = 'import { DomainGroup, extractRootDomain, domainToLabel, groupByDomain, formatLanguageLabel, formatTypeLabel, formatPricingLabel } from "./utils";\n'
    content = content.replace('import { useTranslation } from "@/lib/i18n";', 'import { useTranslation } from "@/lib/i18n";\n' + utils_imports)

# Extract DomainGroupCard
domain_card_match = re.search(r"/\*\* A single expandable domain group card \*/\nfunction DomainGroupCard.*?\n}\n", content, re.DOTALL)
if domain_card_match:
    domain_card_code = domain_card_match.group(0)
    content = content.replace(domain_card_code, "")
    
    domain_card_code = domain_card_code.replace("function DomainGroupCard", "export function DomainGroupCard")
    
    with open(os.path.join(COMPONENTS_DIR, "DomainGroupCard.tsx"), "w", encoding="utf-8") as f:
        f.write('import React, { useState } from "react";\n')
        f.write('import Link from "next/link";\n')
        f.write('import { DomainGroup, formatTypeLabel, formatLanguageLabel, formatPricingLabel } from "../utils";\n\n')
        f.write(domain_card_code)
        
# Extract LanguageFilterPopover
lang_popover_match = re.search(r"/\*\* Searchable language popover \*/\nfunction LanguageFilterPopover.*?\n}\n", content, re.DOTALL)
if lang_popover_match:
    lang_popover_code = lang_popover_match.group(0)
    content = content.replace(lang_popover_code, "")
    
    lang_popover_code = lang_popover_code.replace("function LanguageFilterPopover", "export function LanguageFilterPopover")
    
    with open(os.path.join(COMPONENTS_DIR, "LanguageFilterPopover.tsx"), "w", encoding="utf-8") as f:
        f.write('import React, { useState, useMemo } from "react";\n')
        f.write('import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";\n')
        f.write('import { FacetItem } from "@/lib/api/resources";\n')
        f.write('import { formatLanguageLabel } from "../utils";\n\n')
        f.write(lang_popover_code)

# Add imports for components to page.tsx
imports = """import { DomainGroupCard } from "./components/DomainGroupCard";
import { LanguageFilterPopover } from "./components/LanguageFilterPopover";
"""
content = content.replace('import { useTranslation } from "@/lib/i18n";', 'import { useTranslation } from "@/lib/i18n";\n' + imports)

with open(PAGE_PATH, "w", encoding="utf-8") as f:
    f.write(content)

print("Refactoring complete.")
