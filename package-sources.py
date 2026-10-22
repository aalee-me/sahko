from pathlib import Path
import zipfile,json
root=Path(__file__).parent
with zipfile.ZipFile(root/'downloads/sahko-frontend.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in (root/'frontend').rglob('*'):
  if p.is_file():z.write(p,p.relative_to(root/'frontend'))
 z.writestr('README.md','Serve this folder with a static HTTP server. Demo mode works independently; Live room requires the backend on the same origin. Original uploaded renderer: original-studio.html.\n')
with zipfile.ZipFile(root/'downloads/sahko-backend.zip','w',zipfile.ZIP_DEFLATED) as z:
 for folder in ['frontend','backend','server','migrations','drizzle']:
  for p in (root/folder).rglob('*'):
   if p.is_file():z.write(p,p.relative_to(root))
 for file in ['package.json','build-fullstack.mjs','README.md','.gitignore']:z.write(root/file,file)
 z.writestr('.openai/hosting.json',json.dumps({'d1':'DB','r2':'BUCKET'},indent=2))
