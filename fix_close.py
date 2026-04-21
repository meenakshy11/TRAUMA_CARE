import pathlib

p = pathlib.Path('apps/web/src/pages/Hospitals/HospitalDetailPage.tsx')
src = p.read_text(encoding='utf-8')

# The file ends with blood_section + ")\n}\n\nexport default HospitalDetailPage\n"
# We need to wrap the blood section inside the return JSX properly
# Find where return ( starts and fix the closing

# Remove the broken ending and replace with correct structure
old_end = """        )}
)
}

export default HospitalDetailPage
"""

new_end = """        )}
    </div>
  )
}

export default HospitalDetailPage
"""

if old_end in src:
    src = src.replace(old_end, new_end)
    print('Fixed closing structure')
else:
    print('Pattern not found, showing end:')
    print(repr(src[-200:]))

p.write_text(src, encoding='utf-8')
