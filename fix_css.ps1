$content = Get-Content 'c:\Users\NANDOLIYA BILAL\Desktop\codingfile\Qalamverce\css\style.css'
if ($content.Length -gt 2) {
    $content[0..($content.Length - 3)] | Set-Content 'c:\Users\NANDOLIYA BILAL\Desktop\codingfile\Qalamverce\css\style.css'
}
