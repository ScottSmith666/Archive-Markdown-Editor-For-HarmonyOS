# 鸿蒙版Archive Markdown Editor使用时需注意！

> [!caution]
> 
> 和其他操作系统相比，鸿蒙操作系统（指版本号为5及以上）的权限更严格。其中，对于文件方面，鸿蒙操作系统仅能处理由用户选择的文件，不允许在目录中自由复制。
> 
> 因此鸿蒙版Archive Markdown Editor的使用方式以及功能性相比于其他系统的版本略有差异。

## 一、鸿蒙版Archive Markdown Editor不支持某些格式的另存为操作

由于鸿蒙操作系统权限极为严格，因此鸿蒙版Archive Markdown Editor**不支持将现有的md文件、txt文件或者mdz文件另存为mdz文件**。因为在将md文件或txt文件另存为mdz文件的过程中，会静默地将引用的文件复制并打包进mdz文件内，这个操作在鸿蒙操作系统中是不被允许的，因为鸿蒙操作系统只允许操作用户选中的文件。

所以同样的原因，当你在新建文件（即无标题文件）中引用了多媒体（`![](/path/to/media.jpg)`），也是无法成功保存为mdz文件的。

因此，要想成功用鸿蒙版Archive Markdown Editor保存带多媒体的mdz文件，要这样做。

1. 新建无标题文件，然后立即将其保存为mdz格式。
2. 用下述第二部分的方法在mdz文件中插入多媒体，就可以成功保存了。

## 二、鸿蒙版Archive Markdown Editor的媒体插入方式

打开一份现有的mdz文件，然后点击`菜单栏 > 媒体`就会出现插入不同类型多媒体的下拉选项（一共有4种）。

![]($DOCUMENT_MEDIA/cand-media.jpg)

选择后，就会出现picker供您选择所需多媒体。

![]($DOCUMENT_MEDIA/picker.jpg)

选择之后显示插入成功，对应的Markdown语句会自动进入你的剪贴板，然后你只要粘贴进编辑器中，多媒体文件就显示出来了。
