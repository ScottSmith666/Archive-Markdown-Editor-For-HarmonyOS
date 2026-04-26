# ATTENTION of Archive Markdown Editor HarmonyOS version!

> [!caution]
>
> Compared to other operating systems, HarmonyOS (version 5 and above) has stricter permissions. Specifically, regarding files, HarmonyOS can only process files selected by the user and does not allow free copying within directories.
>
> Therefore, the usage and functionality of the HarmonyOS version of Archive Markdown Editor are slightly different compared to versions on other systems.

## I. The HarmonyOS Archive Markdown Editor does not support the "Save As" operation for certain formats.

Due to the extremely strict permission restrictions of the HarmonyOS, the HarmonyOS Archive Markdown Editor **does not support saving existing .md, .txt, or .mdz files as .mdz files.** This is because the process of saving a .md or .txt file as an .mdz file silently copies and packages the referenced files into the .mdz file. This operation is not allowed in the HarmonyOS, as it only allows operations on files selected by the user.

Therefore, for the same reason, if you reference multimedia (`![](/path/to/media.jpg)`) in a new file (i.e., an untitled file), it will also fail to save as an .mdz file.

Therefore, to successfully save an mdz file with multimedia using the HarmonyOS Archive Markdown Editor, do the following:

1. Create a new untitled file and save it immediately as an mdz file.

2. Insert multimedia into the mdz file using the method described in Part II below, and you can save it successfully.

## II. Media insertion method in HarmonyOS Archive Markdown Editor

Open an existing .mdz file, then click `Menu Bar > Media`. This will bring up dropdown options for inserting different types of multimedia (there are four in total).

![]($DOCUMENT_MEDIA/cand-media.jpg)

After selecting, a picker will appear for you to choose the desired multimedia file.

![]($DOCUMENT_MEDIA/picker.jpg)

After selection, a message will appear indicating successful insertion. The corresponding Markdown statement will automatically be added to your clipboard. Simply paste it into your editor, and the multimedia file will be displayed.
