Room API
========

#  CREATE ROOMS, ITEMS and PEOPLES


To set a new room instance, accessible with the variable 'room'.
```
var room=newRoom(id,     // identifier in dialog file (.po)
                 img,      // optionnal path in ./src/img/ to the picture
                 props     // optionnal properties
                )
```

To add child nodes of the room, use the action methods beginning by `add*` :
```
     room.addDoor(sub_room) == room
     room.addItem(it) == room
```

To create a "child" of the room, use the creation methods beginning by `new*`
(the arguments are the same) :
```
var item=room.newItem('it', img, props)         // imply room.addItem(item)
var person=room.newPeople('person', img, props) // imply room.addItem(person)
var subroom=room.newRoom('subroom', img, props) // imply room.addDoor(sub_room)
```

Note : in order to define path '~/', either calling `newRoom('home')` or set `$home = some_room` is required.

## ABOUT THE ARGUMENTS
* id : the identifier in game dialog file
       GameDialogs file shall contain :
        - room_{id} :      the name of the room
        - room_{id}_text : the description of what happening in
                              the room
        - item_{id}   :      the name
        - people_{id} :      the name
        - item_{id}_text   : description of the item
        - people_{id}_text : description of the people, possibly an interaction

* img : img file in image directory
* props : hash with many optionnal properties

#  PROMPTS IN THE ROOM
## Starting game in the room
If the player start a game or load it from saved state,
you can display a message for the room she/he starts.

Default is the result of `pwd`.
```
$room.setStarterMsg("Welcome !");
```

## Entering in the room
```
$room.setEnterCallback(function(){
// the code to display a message
});
```
## Leaving the room
```
$room.setLeaveCallback(function(){
// the code to display a message
});
```
## Alter the result of a command
You can alter result of a command by defining a hook that can be a text or a function :
```
$room.setCmd({cmd_name},{cmd_result})
item.setCmd({cmd_name},{cmd_result})
```

# Syntaxic sugar in Javascript Code

A room is also accessible with a variable nammed from its own id '$'+id at creation.
Autonamming of room variables allow to structure the code.

## Example

We try to reproduce this file structure:
```
 forest/
 |- clearing/
 |  '- exit/
 |     |- oblivion/
 |     |- freehugger
 |     |- normal_cop
 |     '- pen
 '- waiting_room/
```

Using the API, the code is basically :
```javascript
    newRoom('forest', 'forest.png'
    ).addDoor(
       newRoom('clearing', 'clearing.png')
       .addDoor(
          newRoom('exit')
          .addDoor(
             newRoom('oblivion')
         )
       )
    ).addDoor(
        newRoom('waiting_room')
    )
    $exit.newPeople('freehugger')
    $exit.newPeople('normal_cop')
    $exit.newItem('pen')
```

## More syntaxic sugar
If you want to have your own dialect, you can additionnally use `concatNew` method and alter the prototype to use syntaxic sugar.

```javascript
    var into=(id, img, prop) => window.hasOwnProperty('$'+id) ? window['$'+id] : newRoom(id,img,prop)
    File.prototype.and=() => this.room
    Room.prototype.then=Room.prototype.concatNew
    Room.prototype.go=Room.prototype.addDoor
    Room.prototype.find=Room.prototype.newItem
    Room.prototype.meet=Room.prototype.newPeople

    into('forest', 'forest.png'
    ).go(
      into('clearing', 'clearing.png')
       .then('exit')
       .then('oblivion')
    ).go(
      into('waiting_room')
    )
    into('exit').meet('freehugger','hug.png')
      .and()    .meet('normal_cop')
      .and()    .find('pen')
```

Warning : You shall check the file object prototype to ensure it doesn't overwrite another method or property.

// All bash shortcuts : https://ss64.com/bash/syntax-keyboard.html
