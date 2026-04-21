import pathlib

# Fix blood_stock model - remove back_populates to avoid conflict
p = pathlib.Path('apps/backend/app/models/blood_stock.py')
src = p.read_text(encoding='utf-8')
src = src.replace(
    '    hospital = relationship("Hospital", back_populates="blood_stock")',
    '    hospital = relationship("Hospital")'
)
p.write_text(src, encoding='utf-8')
print('blood_stock model fixed')

# Fix hospital model - remove back_populates from blood_stock relationship
p2 = pathlib.Path('apps/backend/app/models/hospital.py')
src2 = p2.read_text(encoding='utf-8')
src2 = src2.replace(
    '    blood_stock: Mapped[list["BloodStock"]] = relationship("BloodStock", back_populates="hospital", cascade="all, delete-orphan")',
    '    blood_stock: Mapped[list["BloodStock"]] = relationship("BloodStock", cascade="all, delete-orphan")'
)
p2.write_text(src2, encoding='utf-8')
print('hospital model fixed')
