All files and directories, in a linux system, have permissions to limit their use usage to specific operations.

# Directory
A directory is a special file containing a set of references towards other files.

This set is said to be the content of the directory.

Note that these content define the file's names.

| Permission | Description | Numbers |
|------------|-------------|---------|
| Read       | Can see the content of the directory | 7,6,5,4 |
| Write      | Can add and remove content to the directory     | 7,6,3,2 |
| Execute    | Can access to the content of directory | 7,1 |

# Files
A file is set of datas. It can be totally empty.

| Permission | Description | Numbers |
|------------|-------------|---------|
| Read       | Can see the content | 7,6,5,4 |
| Write      | Can add and remove (modify) content  | 7,6,3,2 |
| Execute    | Can use the file as a program | 7,1 |


A file with no permission (0), can be deleted, renamed or moved. It only depends on the rights of the directory which contain the file.

# Rooms
Rooms are directories.

# Peoples and items
Peoples and items are represented by files.

*Phylosophical part*
Notes about execution and reading files:
* if text is invariable, then it shall be only readable and writable
* if text is a variable but nothing change in the environment, then it could be used has an executable
* if text is a variable and it causes change in the environment, then it shall be an executale
* executables files shall have a different result on `cat file` and `./file`.
* keep the idea : `cat` is 'read', 'desc', or 'talk' ; `./` is 'use'.

## People Interactions 
The questions here are :
* how does people are files ?
* how to talk with them ?
* how to get a description of how they look ?
* how to give something ?

A beginning of answer :
* `cat people` provide a description of people.
* The file people could be considered as a program to truly talk with people.
  Therefore, `./people` could allow to discuss with people. 


## Command learning
The questions here are :
* how to talk with a teacher who learn you a command ?
* is it the same way for learning something from a book ?
* how to get a description of how it look ?
* shall we have a command like `source` to have a new command ?

A beginning of answer :
* `cat manuscript` provide a description and get the content.
* `./manuscript` could allow to get its "magical" effect.

# Commands

| Command | Description | Options | Args |
|------------|-------------|---------|--------|
| cat       | (concat streams) Can be used to show the content of a file |  | |
| ls      | List files in the directory (current or the one in args ) | | directory |
| cd      | Access a directory (the one in args ) | | (directory) |
| grep    | reveal the lines in a stream or a file that match a pattern ||pattern file|



