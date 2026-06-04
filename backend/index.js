/*class Demo{
    carname;
    color;
    price;
    fueltype;
    engine;
    constructor(name,color,price,engine,fuel){
        this.carname=name;
        this.color=color;
        this.price=price;
        this.fueltype=fuel;
        this.engine= engine;
    }
}
const c1 = new Demo("Rolls Royce","Black",1000000,"anonymous","any")
console.log(c1)*/




class Animal {
    name;
    color;
    age;
    habitat;
    diet;

    constructor(name, color, age, habitat, diet) {
        this.name = name;
        this.color = color;
        this.age = age;
        this.habitat = habitat;
        this.diet = diet;
    }

    add(x,y){
        console.log(x+y)
    }
}

const a1 = new Animal("Tiger", "Orange", 5, "Forest", "Carnivore");

console.log(a1);
a1.add(20,30)