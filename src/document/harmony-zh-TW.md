# 鴻蒙版Archive Markdown Editor使用時需注意！

> [!caution]
>
> 和其他作業系統相比，鴻蒙作業系統（指版本號為5以上）的權限更嚴格。其中，對於文件方面，鴻蒙作業系統只能處理由使用者選擇的文件，不允許在目錄中自由複製。
>
> 因此鴻蒙版Archive Markdown Editor的使用方式以及功能性相較於其他系統的版本略有差異。

## 一、鴻蒙版Archive Markdown Editor不支援某些格式的另存為操作

由於鴻蒙作業系統權限極為嚴格，因此鴻蒙版Archive Markdown Editor**不支援將現有的md檔案、txt檔案或mdz檔案另存為mdz檔案**。因為在將md檔案或txt檔案另存為mdz檔案的過程中，會靜默地將引用的檔案複製並打包進mdz檔案內，這個操作在鴻蒙作業系統中是不被允許的，因為鴻蒙作業系統只允許操作使用者選取的檔案。

所以同樣的原因，當你在新檔案（即無標題檔案）中引用了多媒體（`![](/path/to/media.jpg)`），也是無法成功儲存為mdz檔案的。

因此，要成功用鴻蒙版Archive Markdown Editor保存帶有多媒體的mdz文件，要這樣做。

1. 新建無標題文件，然後立即儲存為mdz格式。
2. 用下述第二部分的方法在mdz檔案中插入多媒體，就可以成功儲存了。

## 二、鴻蒙版Archive Markdown Editor的媒體插入方式

開啟一份現有的mdz檔案，然後點選`選單列 > 媒體`就會出現插入不同類型多媒體的下拉選項（總共有4種）。

![]($DOCUMENT_MEDIA/cand-media.jpg)

選擇後，就會出現picker供您選擇所需多媒體。

![]($DOCUMENT_MEDIA/picker.jpg)

選擇之後顯示插入成功，對應的Markdown語句會自動進入你的剪貼板，然後你只要貼上進編輯器中，多媒體檔案就顯​​示出來了。
