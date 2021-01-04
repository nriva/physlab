rem -H "c:\Users\riva\OneDrive - CAD IT S.P.A\Public\tryit3.css"
pandoc  -s --toc --metadata pagetitle="PhysLabJs - A Tutorial" --from=markdown --to=html -o %1.html %1.md