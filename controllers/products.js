const Product = require('../models/product');

const getAllProductsStatic=async (req,res)=>{
    // const search='ab';
    // const products=await Product.find({
    //     name:{$regex:search,$options:'i'},
    // });

    //for sort func we need to chain it with find
    const products=await Product.find({price:{$gt:30}}).sort('price').select('name price').limit(10).skip(1);
    res.status(200).json({products,nbHits:products.length});
}

const getAllProducts=async (req,res)=>{
    const {featured,company,name,sort,fields,numericFilters}=req.query;
    const queryObject={}; //instead of directly passing req.query in our find function we create a new object and pass that

    if(featured){
        queryObject.featured = featured==='true'?true:false
    }
    if(company){
        queryObject.company=company;
    }
    //in case of name we will use regex just to make it better
    if(name){
        queryObject.name={$regex:name,$options:'i'};
    }

    if(numericFilters){
        const operatorMap={
            '>':'$gt',
            '>=':'$gte',
            '=':'$eq',
            '<':'$lt',
            '<=':'$lte',
        }
        // console.log(numericFilters);
        const regEx = /\b(<|>|>=|<=|=)\b/g;
        let filters = numericFilters.replace(
            regEx,
            (match) => `-${operatorMap[match]}-`
        );
        // console.log(filters);
        const options = ['price','rating'];
        filters = filters.split(',').forEach((item)=>{
            const [field,operator,value] = item.split('-');
            if(options.includes(field)){
                queryObject[field] = { [operator]: Number(value) }
            }
        })
        console.log(queryObject);
    }
    

    //sort
    let result = Product.find(queryObject);  //remove await from here otherwise it will give the final value and we will not be able to sort it 
    if(sort){
        const sortList=sort.split(',').join(' ');
        result=result.sort(sortList);
    }else{
        result=result.sort('createdAt')
    }


    if(fields){
        const fieldsList=fields.split(',').join(' ');
        result=result.select(fieldsList);
    }
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page-1)*limit;
    //suppose total 23 and limit of 7
    //it means 4 pages => 7 7 7 2
    //so if we want to see 3rd page we need to skip 14 elements

    result = result.skip(skip).limit(limit);

    const products=await result;
    res.status(200).json({products,nbHits:products.length});
}

module.exports={
    getAllProducts,getAllProductsStatic,
}